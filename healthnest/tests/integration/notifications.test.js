import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { db } from "@/lib/db";
import { saveArticle, reviewAction } from "@/app/actions/articles";
import {
  resetDb, makeUser, makeCategory, makeArticle, makeMedia, loginAs, form, run, validArticleFields, longBody,
} from "../helpers";

let admin, admin2, writer;
beforeEach(async () => {
  await resetDb();
  admin = await makeUser("admin");
  admin2 = await makeUser("admin");
  writer = await makeUser("freelancer");
  loginAs(null);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const mails = (where = {}) => db.emailLog.findMany({ where, orderBy: { createdAt: "asc" } });

async function submitted(authorId, extra = {}) {
  const cover = await makeMedia(admin.id);
  const category = await makeCategory();
  const a = await makeArticle(authorId, {
    title: "Staying hydrated through the summer",
    excerpt: "A short summary of the article that is comfortably long enough to pass validation.",
    body: longBody, coverImageUrl: cover.url, coverImageAlt: "Alt", categoryId: category.id,
    status: "submitted", seoTitle: "SEO", seoDescription: "SEO desc", ...extra,
  });
  await db.source.create({ data: { articleId: a.id, title: "T", publisher: "WHO", url: "https://who.int/x" } });
  return a;
}

describe("when a writer submits", () => {
  it("emails every active admin once, with a link to the review page", async () => {
    await db.user.update({ where: { id: (await makeUser("admin")).id }, data: { status: "deactivated" } });
    loginAs(writer);
    const fields = await validArticleFields(writer.id, { intent: "submit" });
    await run(() => saveArticle(null, form(fields)));
    const sent = await mails({ kind: "article_submitted" });
    const article = await db.article.findFirst();
    expect(sent.map((m) => m.to).sort()).toEqual([admin.email, admin2.email].sort());
    for (const m of sent) {
      expect(m.html).toContain(`/admin/articles/${article.id}`);
      expect(m.subject).toContain(fields.title);
      expect(m.html).toContain(writer.name);
    }
  });

  it("sends nothing when the submission is rejected, or when it is only a draft", async () => {
    loginAs(writer);
    await run(() => saveArticle(null, form({ title: "A title that is long enough", intent: "submit" })));
    await run(() => saveArticle(null, form({ title: "A title that is long enough", intent: "save" })));
    expect(await db.emailLog.count()).toBe(0);
  });

  it("does not email the admins when an admin submits their own article", async () => {
    loginAs(admin);
    const fields = await validArticleFields(admin.id, { intent: "submit" });
    await run(() => saveArticle(null, form(fields)));
    expect(await db.emailLog.count()).toBe(0);
  });

  it("still submits the article if the email provider is down", async () => {
    vi.stubEnv("EMAIL_PROVIDER", "resend");
    vi.stubEnv("RESEND_API_KEY", "re_test_key_123");
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("fetch failed"); }));
    loginAs(writer);
    const fields = await validArticleFields(writer.id, { intent: "submit" });
    const r = await run(() => saveArticle(null, form(fields)));
    expect(r.redirectTo).toContain("submitted=1");
    expect((await db.article.findFirst()).status).toBe("submitted");
    expect(await db.emailLog.count({ where: { status: "failed" } })).toBe(2);
  });
});

describe("when an admin decides", () => {
  beforeEach(() => loginAs(admin));

  it("tells the author about requested changes, including the note", async () => {
    const a = await submitted(writer.id);
    await run(() => reviewAction(null, form({ id: a.id, action: "request_changes", message: "Please add a section for children." })));
    const [m] = await mails({ kind: "changes_requested" });
    expect(m.to).toBe(writer.email);
    expect(m.html).toContain("Please add a section for children.");
    expect(m.text).toContain("Please add a section for children.");
    expect(m.html).toContain(`/freelancer/articles/${a.id}`);
  });

  it("escapes a note that contains markup", async () => {
    const a = await submitted(writer.id);
    await run(() => reviewAction(null, form({ id: a.id, action: "request_changes", message: '<img src=x onerror=alert(1)> <a href="https://evil.example">click</a>' })));
    const [m] = await mails({ kind: "changes_requested" });
    expect(m.html).not.toContain("<img");
    expect(m.html).not.toContain('href="https://evil.example"');
    expect(m.html).toContain("&lt;img");
  });

  it("tells the author when the article is approved, and when it is published (link to the live page)", async () => {
    const a = await submitted(writer.id);
    await run(() => reviewAction(null, form({ id: a.id, action: "approve" })));
    expect((await mails({ kind: "article_approved" }))[0].to).toBe(writer.email);
    await run(() => reviewAction(null, form({ id: a.id, action: "publish", checklist: "on" })));
    const pub = await mails({ kind: "article_published" });
    expect(pub).toHaveLength(1);
    expect(pub[0].html).toContain(`/articles/${a.slug}`);
  });

  it("does not email again when an article is unpublished and published a second time", async () => {
    const a = await submitted(writer.id);
    await run(() => reviewAction(null, form({ id: a.id, action: "publish", checklist: "on" })));
    await run(() => reviewAction(null, form({ id: a.id, action: "unpublish" })));
    await db.article.update({ where: { id: a.id }, data: { status: "approved" } });
    await run(() => reviewAction(null, form({ id: a.id, action: "publish", checklist: "on" })));
    expect(await mails({ kind: "article_published" })).toHaveLength(1);
  });

  it("sends nothing for a failed action, or when the admin wrote the article, or when the author is deactivated", async () => {
    const a = await submitted(writer.id);
    await run(() => reviewAction(null, form({ id: a.id, action: "request_changes", message: "" }))); // rejected: no note
    const own = await submitted(admin.id);
    await run(() => reviewAction(null, form({ id: own.id, action: "request_changes", message: "note to self" })));
    await db.user.update({ where: { id: writer.id }, data: { status: "deactivated" } });
    const gone = await submitted(writer.id, { title: "An article by someone who left", slug: "left-1" });
    await run(() => reviewAction(null, form({ id: gone.id, action: "request_changes", message: "note" })));
    expect(await db.emailLog.count()).toBe(0);
  });
});
