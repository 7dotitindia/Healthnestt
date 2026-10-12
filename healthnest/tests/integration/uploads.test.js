import { describe, it, expect, beforeEach, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { db } from "@/lib/db";
import { POST } from "@/app/api/upload/route";
import { GET } from "@/app/uploads/[name]/route";
import { deleteMedia } from "@/app/actions/media";
import { UPLOAD_DIR } from "@/lib/storage";
import { resetDb, makeUser, makeMedia, makeArticle, loginAs, form, run } from "../helpers";

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
let admin, writer, reader;

beforeEach(async () => {
  await resetDb();
  admin = await makeUser("admin");
  writer = await makeUser("freelancer");
  reader = await makeUser("reader");
  loginAs(null);
});

afterAll(() => fs.rmSync(UPLOAD_DIR, { recursive: true, force: true }));

function upload(bytes, name = "photo.png", headers = {}) {
  const fd = new FormData();
  if (bytes !== null) fd.append("file", new Blob([bytes]), name);
  return POST(new Request("http://localhost:3000/api/upload", { method: "POST", body: fd, headers }));
}
const asJson = async (res) => ({ status: res.status, body: await res.json() });
const serve = (name) => GET(new Request(`http://localhost:3000/uploads/${name}`), { params: Promise.resolve({ name }) });

describe("POST /api/upload: who may upload", () => {
  it("refuses logged-out visitors and readers", async () => {
    expect((await upload(PNG)).status).toBe(401);
    loginAs(reader);
    expect((await upload(PNG)).status).toBe(401);
    expect(await db.mediaAsset.count()).toBe(0);
  });

  it("accepts freelancers and admins", async () => {
    loginAs(writer);
    expect((await upload(PNG)).status).toBe(200);
    loginAs(admin);
    expect((await upload(PNG)).status).toBe(200);
    expect(await db.mediaAsset.count()).toBe(2);
  });

  it("refuses a request that comes from another website", async () => {
    loginAs(writer);
    const res = await upload(PNG, "photo.png", { origin: "https://evil.example.com", host: "localhost:3000" });
    expect(res.status).toBe(403);
    expect(await db.mediaAsset.count()).toBe(0);
  });
});

describe("POST /api/upload: what it accepts", () => {
  beforeEach(() => loginAs(writer));

  it("stores a real image with a random name and records who uploaded it", async () => {
    const { status, body } = await asJson(await upload(PNG, "my holiday photo.PNG"));
    expect(status).toBe(200);
    expect(body.url).toMatch(/^\/uploads\/[a-f0-9]{32}\.png$/);
    const row = await db.mediaAsset.findUnique({ where: { id: body.id } });
    expect(row).toMatchObject({ mimeType: "image/png", sizeBytes: PNG.length, uploadedById: writer.id, originalName: "my holiday photo.PNG" });
    expect(fs.existsSync(path.join(UPLOAD_DIR, row.filename))).toBe(true);
  });

  it("decides the type from the file contents, not the name", async () => {
    const { body } = await asJson(await upload(PNG, "actually-a-png.jpg"));
    expect(body.url).toMatch(/\.png$/);
  });

  it.each([
    ["a script named .jpg", Buffer.from("<script>alert(1)</script>"), "evil.jpg"],
    ["an SVG", Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), "x.svg"],
    ["an HTML page named .png", Buffer.from("<html><body>hi</body></html>"), "page.png"],
    ["a text file", Buffer.from("just some text, not an image"), "notes.txt"],
  ])("rejects %s", async (_n, bytes, name) => {
    const filesOnDisk = () => (fs.existsSync(UPLOAD_DIR) ? fs.readdirSync(UPLOAD_DIR).length : 0);
    const before = filesOnDisk(); // earlier tests in this file may have stored real images
    const { status, body } = await asJson(await upload(bytes, name));
    expect(status).toBe(415);
    expect(body.error).toMatch(/JPEG, PNG or WebP/);
    expect(await db.mediaAsset.count()).toBe(0);
    expect(filesOnDisk()).toBe(before); // nothing was written
  });

  it("rejects an empty file, a missing file and a file over 5 MB", async () => {
    expect((await upload(Buffer.alloc(0))).status).toBe(400);
    expect((await upload(null)).status).toBe(400);
    const big = Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024)]);
    expect((await upload(big)).status).toBe(413);
    expect(await db.mediaAsset.count()).toBe(0);
  });

  it("rate-limits one user's uploads", async () => {
    const codes = [];
    for (let i = 0; i < 32; i++) codes.push((await upload(Buffer.alloc(0))).status);
    expect(codes.slice(0, 30).every((c) => c === 400)).toBe(true);
    expect(codes[31]).toBe(429);
  });
});

describe("GET /uploads/[name]", () => {
  it("serves an uploaded image with safe headers", async () => {
    loginAs(writer);
    const { body } = await asJson(await upload(PNG));
    const res = await serve(body.url.split("/").pop());
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("cache-control")).toContain("immutable");
    expect(Buffer.from(await res.arrayBuffer()).equals(PNG)).toBe(true);
  });

  it.each([
    "../../.env",
    "..%2f..%2f.env",
    "..\\..\\.env",
    "notarealfile.png",
    "0123456789abcdef0123456789abcdef.svg",
    "0123456789abcdef0123456789abcdef.png/../../x",
    "0123456789ABCDEF0123456789ABCDEF.png",
    "",
  ])("returns 404 for the name %j", async (name) => {
    expect((await serve(name)).status).toBe(404);
  });

  it("returns 404 for a well-formed name that does not exist", async () => {
    expect((await serve("a".repeat(32) + ".png")).status).toBe(404);
  });
});

describe("deleteMedia", () => {
  const write = (m) => {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    fs.writeFileSync(path.join(UPLOAD_DIR, m.filename), PNG);
  };

  it("deletes an unused image, row and file", async () => {
    const m = await makeMedia(writer.id);
    write(m);
    loginAs(admin);
    await deleteMedia(form({ id: m.id }));
    expect(await db.mediaAsset.count()).toBe(0);
    expect(fs.existsSync(path.join(UPLOAD_DIR, m.filename))).toBe(false);
  });

  it("keeps an image that is an article's cover", async () => {
    const m = await makeMedia(writer.id);
    write(m);
    await makeArticle(writer.id, { coverImageUrl: m.url });
    loginAs(admin);
    await deleteMedia(form({ id: m.id }));
    expect(await db.mediaAsset.count()).toBe(1);
    expect(fs.existsSync(path.join(UPLOAD_DIR, m.filename))).toBe(true);
  });

  it("keeps an image that appears inside an article body", async () => {
    const m = await makeMedia(writer.id);
    await makeArticle(writer.id, { body: `<p>Hi</p><img src="${m.url}" alt="x">` });
    loginAs(admin);
    await deleteMedia(form({ id: m.id }));
    expect(await db.mediaAsset.count()).toBe(1);
  });

  it("refuses everyone who is not an admin", async () => {
    const m = await makeMedia(writer.id);
    for (const who of [writer, reader, null]) {
      loginAs(who);
      expect((await run(() => deleteMedia(form({ id: m.id })))).redirectTo).toBe("/staff/login");
    }
    expect(await db.mediaAsset.count()).toBe(1);
  });
});
