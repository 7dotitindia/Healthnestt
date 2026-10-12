import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { POST } from "@/app/api/view/route";
import { resetDb, makeUser, makeArticle } from "../helpers";

let writer;
let ipCounter = 0;
let ip;

beforeEach(async () => {
  await resetDb();
  writer = await makeUser("freelancer");
  ip = `10.7.0.${++ipCounter}`; // a fresh visitor per test, so the per-visitor limits do not leak between tests
});

const view = (body, headers = {}) =>
  POST(
    new Request("http://localhost:3000/api/view", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip, "user-agent": "Mozilla/5.0 Chrome/120", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
const count = async (id) => (await db.article.findUnique({ where: { id } })).viewCount;

describe("POST /api/view", () => {
  it("adds one view to a published article", async () => {
    const a = await makeArticle(writer.id, { status: "published" });
    expect((await view({ slug: a.slug })).status).toBe(204);
    expect(await count(a.id)).toBe(1);
  });

  it("counts a visitor once per article per 30 minutes", async () => {
    const a = await makeArticle(writer.id, { status: "published" });
    await view({ slug: a.slug });
    await view({ slug: a.slug });
    await view({ slug: a.slug });
    expect(await count(a.id)).toBe(1);
  });

  it("counts different articles separately for the same visitor", async () => {
    const a = await makeArticle(writer.id, { status: "published" });
    const b = await makeArticle(writer.id, { status: "published" });
    await view({ slug: a.slug });
    await view({ slug: b.slug });
    expect([await count(a.id), await count(b.id)]).toEqual([1, 1]);
  });

  it("does not count views of unpublished articles", async () => {
    const ids = [];
    for (const status of ["draft", "submitted", "changes_requested", "approved", "archived"]) {
      const a = await makeArticle(writer.id, { status });
      ids.push(a.id);
      await view({ slug: a.slug });
    }
    for (const id of ids) expect(await count(id)).toBe(0);
  });

  it("ignores crawlers and tools", async () => {
    const a = await makeArticle(writer.id, { status: "published" });
    for (const ua of ["Googlebot/2.1", "curl/8.0", "Mozilla/5.0 HeadlessChrome", "Slackbot-LinkExpanding", "Lighthouse"]) {
      expect((await view({ slug: a.slug }, { "user-agent": ua })).status).toBe(204);
    }
    expect(await count(a.id)).toBe(0);
  });

  it("refuses requests from another website", async () => {
    const a = await makeArticle(writer.id, { status: "published" });
    const res = await view({ slug: a.slug }, { origin: "https://evil.example.com", host: "localhost:3000" });
    expect(res.status).toBe(403);
    expect(await count(a.id)).toBe(0);
  });

  it("rejects malformed input", async () => {
    expect((await view("{not json")).status).toBe(400);
    expect((await view({ slug: 12345 })).status).toBe(400);
    expect((await view({})).status).toBe(400);
    expect((await view({ slug: "a".repeat(500) })).status).toBe(400);
  });

  it("does not fail or create anything for an unknown article", async () => {
    expect((await view({ slug: "no-such-article" })).status).toBe(204);
    expect(await db.article.count()).toBe(0);
  });

  it("caps how many articles one visitor can inflate per hour", async () => {
    const articles = [];
    for (let i = 0; i < 125; i++) articles.push(await db.article.create({ data: { title: `Bulk ${i} article for the cap test`, slug: `bulk-${i}`, authorId: writer.id, status: "published" } }));
    for (const a of articles) await view({ slug: a.slug });
    const total = (await db.article.aggregate({ _sum: { viewCount: true } }))._sum.viewCount;
    expect(total).toBe(120);
  });
});
