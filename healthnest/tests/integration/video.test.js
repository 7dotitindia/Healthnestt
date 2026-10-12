import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { saveArticle } from "@/app/actions/articles";
import { getVideoArticles, countVideoArticles } from "@/lib/queries";
import { resetDb, makeUser, makeArticle, loginAs, form, run, validArticleFields } from "../helpers";

const ID = "dQw4w9WgXcQ";
let admin, writer;

beforeEach(async () => {
  await resetDb();
  admin = await makeUser("admin");
  writer = await makeUser("freelancer");
  loginAs(null);
});

const save = async (user, extra) => {
  const fields = await validArticleFields(admin.id);
  loginAs(user);
  return run(() => saveArticle(null, form({ ...fields, intent: "save", ...extra })));
};

describe("saving an article with a video", () => {
  it("stores only the video id from a pasted YouTube link", async () => {
    const r = await save(writer, { videoUrl: `https://www.youtube.com/watch?v=${ID}&t=9s` });
    expect(r.redirectTo).toMatch(/saved=1/);
    expect((await db.article.findFirst()).videoId).toBe(ID);
  });

  it("lets an admin add one too", async () => {
    await save(admin, { videoUrl: `https://youtu.be/${ID}` });
    expect((await db.article.findFirst()).videoId).toBe(ID);
  });

  it("is happy with no video, and stores nothing for it", async () => {
    await save(writer, {});
    expect((await db.article.findFirst()).videoId).toBeNull();
  });

  it.each([
    ["another site", `https://vimeo.com/${ID}`],
    ["a look-alike host", `https://youtube.com.evil.example/watch?v=${ID}`],
    ["a script", "javascript:alert(1)"],
    ["a bare id", ID],
    ["a playlist", "https://www.youtube.com/playlist?list=PL1234567890A"],
  ])("refuses %s and saves nothing", async (_label, videoUrl) => {
    const r = await save(writer, { videoUrl });
    expect(r.result.errors[0]).toMatch(/YouTube/);
    expect(await db.article.count()).toBe(0);
  });

  it("removes the video when the field is cleared on an existing article", async () => {
    await save(writer, { videoUrl: `https://youtu.be/${ID}` });
    const a = await db.article.findFirst();
    const fields = await validArticleFields(admin.id);
    loginAs(writer);
    await run(() => saveArticle(null, form({ ...fields, id: a.id, intent: "save", videoUrl: "" })));
    expect((await db.article.findUnique({ where: { id: a.id } })).videoId).toBeNull();
  });

  it("keeps the old video when a bad link is submitted", async () => {
    await save(writer, { videoUrl: `https://youtu.be/${ID}` });
    const a = await db.article.findFirst();
    const fields = await validArticleFields(admin.id);
    loginAs(writer);
    const r = await run(() => saveArticle(null, form({ ...fields, id: a.id, intent: "save", videoUrl: "https://evil.example/x" })));
    expect(r.result.errors).toBeTruthy();
    expect((await db.article.findUnique({ where: { id: a.id } })).videoId).toBe(ID);
  });
});

describe("the videos page query", () => {
  const published = (extra) => makeArticle(writer.id, { status: "published", publishedAt: new Date(), ...extra });

  it("lists only published articles that have a video, newest first", async () => {
    const older = await published({ videoId: ID, publishedAt: new Date("2026-01-01") });
    const newer = await published({ videoId: "abcdefghijk", publishedAt: new Date("2026-06-01") });
    await published({});                                   // published, no video
    await makeArticle(writer.id, { videoId: ID });         // draft with video
    await makeArticle(writer.id, { videoId: ID, status: "archived" });

    expect((await getVideoArticles()).map((a) => a.id)).toEqual([newer.id, older.id]);
    expect(await countVideoArticles()).toBe(2);
  });

  it("pages through results", async () => {
    for (let i = 0; i < 3; i++) await published({ videoId: ID, publishedAt: new Date(2026, 0, i + 1) });
    expect(await getVideoArticles(2, 0)).toHaveLength(2);
    expect(await getVideoArticles(2, 2)).toHaveLength(1);
  });
});
