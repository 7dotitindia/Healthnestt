import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { saveArticle, reviewAction } from "@/app/actions/articles";
import {
  resetDb, makeUser, makeCategory, makeArticle, makeMedia, loginAs, form, run, validArticleFields, longBody,
} from "../helpers";

let admin, writer, otherWriter, reader;

beforeEach(async () => {
  await resetDb();
  admin = await makeUser("admin");
  writer = await makeUser("freelancer");
  otherWriter = await makeUser("freelancer");
  reader = await makeUser("reader");
  loginAs(null);
});

// An article that is complete enough to publish, sitting in the given status.
async function readyArticle(authorId, extra = {}) {
  const cover = await makeMedia(admin.id);
  const category = await makeCategory();
  const article = await makeArticle(authorId, {
    excerpt: "A short summary of the article that is comfortably long enough to pass validation.",
    body: longBody,
    coverImageUrl: cover.url,
    coverImageAlt: "Alt text",
    categoryId: category.id,
    status: "submitted",
    seoTitle: "SEO title",
    seoDescription: "SEO description",
    ...extra,
  });
  await db.source.create({ data: { articleId: article.id, title: "T", publisher: "WHO", url: "https://who.int/x" } });
  return article;
}

const status = async (id) => (await db.article.findUnique({ where: { id } })).status;

describe("saveArticle: who may write", () => {
  it("sends logged-out visitors to the staff login", async () => {
    const r = await run(() => saveArticle(null, form({ title: "A perfectly fine title here" })));
    expect(r.redirectTo).toBe("/staff/login");
    expect(await db.article.count()).toBe(0);
  });

  it("does not let a reader account write articles", async () => {
    loginAs(reader);
    const r = await run(() => saveArticle(null, form({ title: "A perfectly fine title here" })));
    expect(r.redirectTo).toBe("/staff/login");
    expect(await db.article.count()).toBe(0);
  });

  it("lets a freelancer save a draft, owned by them", async () => {
    loginAs(writer);
    const r = await run(() => saveArticle(null, form({ title: "My first draft article title", intent: "save" })));
    const a = await db.article.findFirst();
    expect(r.redirectTo).toBe(`/freelancer/articles/${a.id}?saved=1`);
    expect(a.status).toBe("draft");
    expect(a.authorId).toBe(writer.id);
    expect(a.slug).toBe("my-first-draft-article-title");
  });

  it("requires a title", async () => {
    loginAs(writer);
    const r = await run(() => saveArticle(null, form({ title: " ", intent: "save" })));
    expect(r.result.errors[0]).toMatch(/title/i);
  });

  it("stops one freelancer editing another freelancer's article", async () => {
    const theirs = await makeArticle(otherWriter.id, { title: "Someone else's draft title" });
    loginAs(writer);
    const r = await run(() => saveArticle(null, form({ id: theirs.id, title: "Hijacked title for this article", intent: "save" })));
    expect(r.result.errors[0]).toMatch(/can't edit/i);
    expect((await db.article.findUnique({ where: { id: theirs.id } })).title).toBe("Someone else's draft title");
  });
});

describe("saveArticle: submitting for review", () => {
  it("rejects an incomplete submission and lists the problems", async () => {
    loginAs(writer);
    const r = await run(() => saveArticle(null, form({ title: "A title that is long enough", intent: "submit" })));
    expect(r.result.errors.length).toBeGreaterThanOrEqual(5);
    expect(r.result.errors.join(" ")).toMatch(/source/i);
    expect(await db.article.count()).toBe(0);
  });

  it("accepts a complete submission and stores tags and sources", async () => {
    loginAs(writer);
    const fields = await validArticleFields(writer.id, { intent: "submit" });
    const r = await run(() => saveArticle(null, form(fields)));
    const a = await db.article.findFirst({ include: { tags: { include: { tag: true } }, sources: true } });
    expect(r.redirectTo).toBe(`/freelancer/articles/${a.id}?submitted=1`);
    expect(a.status).toBe("submitted");
    expect(a.submittedAt).toBeInstanceOf(Date);
    expect(a.tags.map((t) => t.tag.name).sort()).toEqual(["summer", "water"]);
    expect(a.sources).toHaveLength(1);
    expect(a.readingTimeMin).toBeGreaterThanOrEqual(1);
  });

  it("rejects a source that is not an https link", async () => {
    loginAs(writer);
    const fields = await validArticleFields(writer.id, {
      intent: "submit",
      sources: JSON.stringify([{ title: "Bad", publisher: "X", url: "javascript:alert(1)" }]),
    });
    const r = await run(() => saveArticle(null, form(fields)));
    expect(r.result.errors.join(" ")).toMatch(/source/i);
  });

  it("locks the article once it is submitted", async () => {
    loginAs(writer);
    const fields = await validArticleFields(writer.id, { intent: "submit" });
    await run(() => saveArticle(null, form(fields)));
    const a = await db.article.findFirst();
    const r = await run(() => saveArticle(null, form({ ...fields, id: a.id, title: "Trying to edit after submit now", intent: "save" })));
    expect(r.result.errors[0]).toMatch(/can't edit/i);
    expect((await db.article.findUnique({ where: { id: a.id } })).title).toBe(fields.title);
  });

  it("lets a freelancer resubmit after changes were requested", async () => {
    loginAs(writer);
    const fields = await validArticleFields(writer.id, { intent: "submit" });
    await run(() => saveArticle(null, form(fields)));
    const a = await db.article.findFirst();
    await db.article.update({ where: { id: a.id }, data: { status: "changes_requested" } });
    const r = await run(() => saveArticle(null, form({ ...fields, id: a.id, title: "Improved title after the feedback", intent: "submit" })));
    expect(r.redirectTo).toContain("submitted=1");
    expect(await status(a.id)).toBe("submitted");
  });
});

describe("saveArticle: things a freelancer must not be able to do", () => {
  it("ignores admin-only fields (SEO, featured, slug)", async () => {
    loginAs(writer);
    await run(() => saveArticle(null, form({
      title: "A title that is long enough", intent: "save",
      seoTitle: "Sneaky SEO", seoDescription: "Sneaky", isFeatured: "on", slug: "chosen-by-writer",
    })));
    const a = await db.article.findFirst();
    expect(a.seoTitle).toBeNull();
    expect(a.seoDescription).toBeNull();
    expect(a.isFeatured).toBe(false);
    expect(a.slug).toBe("a-title-that-is-long-enough");
  });

  it("cannot create an article already marked published, whatever the form says", async () => {
    loginAs(writer);
    await run(() => saveArticle(null, form({ title: "A title that is long enough", intent: "save", status: "published" })));
    expect((await db.article.findFirst()).status).toBe("draft");
  });

  it("cannot use a cover image that was not uploaded through the site", async () => {
    loginAs(writer);
    const r = await run(() => saveArticle(null, form({
      title: "A title that is long enough", intent: "save", coverImageUrl: "https://evil.example.com/pixel.png",
    })));
    expect(r.result.errors[0]).toMatch(/cover image/i);
    expect(await db.article.count()).toBe(0);
  });

  it("has dangerous HTML removed from the body before it is stored", async () => {
    loginAs(writer);
    await run(() => saveArticle(null, form({
      title: "A title that is long enough", intent: "save",
      body: '<p>Safe</p><script>alert(1)</script><img src="https://evil.com/x.png" alt="x"><a href="javascript:alert(1)">x</a>',
    })));
    const body = (await db.article.findFirst()).body;
    expect(body).toContain("<p>Safe</p>");
    expect(body).not.toMatch(/script|evil\.com|javascript:/i);
  });
});

describe("saveArticle: admin", () => {
  it("can set SEO fields and feature an article", async () => {
    loginAs(admin);
    const r = await run(() => saveArticle(null, form({
      title: "An admin written article title", intent: "save", seoTitle: "SEO T", seoDescription: "SEO D", isFeatured: "on",
    })));
    const a = await db.article.findFirst();
    expect(r.redirectTo).toBe(`/admin/articles/${a.id}?saved=1`);
    expect(a.seoTitle).toBe("SEO T");
    expect(a.isFeatured).toBe(true);
  });

  it("keeps the slug locked once an article has been published", async () => {
    const a = await makeArticle(writer.id, { title: "Already published article title", slug: "original-slug", status: "published", publishedAt: new Date() });
    loginAs(admin);
    await run(() => saveArticle(null, form({ id: a.id, title: "Already published article title", slug: "new-slug", intent: "save" })));
    expect((await db.article.findUnique({ where: { id: a.id } })).slug).toBe("original-slug");
  });

  it("gives colliding titles different slugs", async () => {
    loginAs(admin);
    await run(() => saveArticle(null, form({ title: "Exactly the same title", intent: "save" })));
    await run(() => saveArticle(null, form({ title: "Exactly the same title", intent: "save" })));
    const slugs = (await db.article.findMany()).map((a) => a.slug).sort();
    expect(slugs).toEqual(["exactly-the-same-title", "exactly-the-same-title-2"]);
  });
});

describe("reviewAction: only the admin can review", () => {
  it.each([
    ["a freelancer", () => loginAs(writer)],
    ["the article's own author", () => loginAs(writer)],
    ["a reader", () => loginAs(reader)],
    ["a logged-out visitor", () => loginAs(null)],
  ])("rejects %s and leaves the article alone", async (_who, login) => {
    const a = await readyArticle(writer.id);
    login();
    for (const action of ["publish", "approve", "request_changes", "archive", "unpublish"]) {
      const r = await run(() => reviewAction(null, form({ id: a.id, action, checklist: "on", message: "note" })));
      expect(r.redirectTo).toBe("/staff/login");
    }
    expect(await status(a.id)).toBe("submitted");
    expect(await db.reviewNote.count()).toBe(0);
  });
});

describe("reviewAction: admin workflow", () => {
  beforeEach(() => loginAs(admin));

  it("requires a note when requesting changes", async () => {
    const a = await readyArticle(writer.id);
    const r = await run(() => reviewAction(null, form({ id: a.id, action: "request_changes", message: "  " })));
    expect(r.result.errors[0]).toMatch(/note/i);
    expect(await status(a.id)).toBe("submitted");
  });

  it("requests changes with a note, recorded in the review history", async () => {
    const a = await readyArticle(writer.id);
    const r = await run(() => reviewAction(null, form({ id: a.id, action: "request_changes", message: "Add a section for children." })));
    expect(r.redirectTo).toBe(`/admin/articles/${a.id}?done=request_changes`);
    expect(await status(a.id)).toBe("changes_requested");
    const note = await db.reviewNote.findFirst();
    expect(note).toMatchObject({ articleId: a.id, adminId: admin.id, type: "changes_requested", message: "Add a section for children." });
  });

  it("will not publish until the checklist is ticked", async () => {
    const a = await readyArticle(writer.id);
    const r = await run(() => reviewAction(null, form({ id: a.id, action: "publish" })));
    expect(r.result.errors[0]).toMatch(/checklist/i);
    expect(await status(a.id)).toBe("submitted");
  });

  it("will not publish without SEO fields", async () => {
    const a = await readyArticle(writer.id, { seoTitle: null, seoDescription: null });
    const r = await run(() => reviewAction(null, form({ id: a.id, action: "publish", checklist: "on" })));
    expect(r.result.errors.join(" ")).toMatch(/SEO title/);
    expect(r.result.errors.join(" ")).toMatch(/SEO description/);
    expect(await status(a.id)).toBe("submitted");
  });

  it("will not publish an article that has no sources", async () => {
    const a = await readyArticle(writer.id);
    await db.source.deleteMany({ where: { articleId: a.id } });
    const r = await run(() => reviewAction(null, form({ id: a.id, action: "publish", checklist: "on" })));
    expect(r.result.errors.join(" ")).toMatch(/source/i);
    expect(await status(a.id)).toBe("submitted");
  });

  it("publishes a complete article and stamps the dates", async () => {
    const a = await readyArticle(writer.id);
    const r = await run(() => reviewAction(null, form({ id: a.id, action: "publish", checklist: "on" })));
    expect(r.redirectTo).toBe(`/admin/articles/${a.id}?done=publish`);
    const p = await db.article.findUnique({ where: { id: a.id } });
    expect(p.status).toBe("published");
    expect(p.publishedAt).toBeInstanceOf(Date);
    expect(p.lastReviewedAt).toBeInstanceOf(Date);
    const months = (p.nextReviewDueAt - p.lastReviewedAt) / (1000 * 60 * 60 * 24 * 30);
    expect(months).toBeGreaterThan(11.5);
    expect(months).toBeLessThan(12.5);
  });

  it("approves a submitted article, then publishes it", async () => {
    const a = await readyArticle(writer.id);
    await run(() => reviewAction(null, form({ id: a.id, action: "approve" })));
    expect(await status(a.id)).toBe("approved");
    expect((await db.reviewNote.findFirst()).type).toBe("approved");
    await run(() => reviewAction(null, form({ id: a.id, action: "publish", checklist: "on" })));
    expect(await status(a.id)).toBe("published");
  });

  it.each([
    ["draft", "publish"],
    ["draft", "approve"],
    ["draft", "request_changes"],
    ["changes_requested", "publish"],
    ["changes_requested", "approve"],
    ["approved", "request_changes"],
    ["published", "approve"],
    ["archived", "approve"],
  ])("rejects %s -> %s", async (from, action) => {
    const a = await readyArticle(writer.id, { status: from });
    const r = await run(() => reviewAction(null, form({ id: a.id, action, checklist: "on", message: "note" })));
    expect(r.result.errors[0]).toMatch(/can't move/i);
    expect(await status(a.id)).toBe(from);
  });

  it("rejects an unknown action and an unknown article", async () => {
    const a = await readyArticle(writer.id);
    expect((await run(() => reviewAction(null, form({ id: a.id, action: "delete-everything" })))).result.errors[0]).toMatch(/unknown/i);
    expect((await run(() => reviewAction(null, form({ id: "nope", action: "publish", checklist: "on" })))).result.errors[0]).toMatch(/not found/i);
  });

  it("unpublishes to draft, archives, and restores, keeping the original publish date", async () => {
    const a = await readyArticle(writer.id);
    await run(() => reviewAction(null, form({ id: a.id, action: "publish", checklist: "on" })));
    const first = (await db.article.findUnique({ where: { id: a.id } })).publishedAt;

    await run(() => reviewAction(null, form({ id: a.id, action: "unpublish" })));
    expect(await status(a.id)).toBe("draft");

    // draft cannot be re-published directly; it has to go through submit again
    const blocked = await run(() => reviewAction(null, form({ id: a.id, action: "publish", checklist: "on" })));
    expect(blocked.result.errors[0]).toMatch(/can't move/i);

    await db.article.update({ where: { id: a.id }, data: { status: "published" } });
    await run(() => reviewAction(null, form({ id: a.id, action: "archive" })));
    expect(await status(a.id)).toBe("archived");
    await run(() => reviewAction(null, form({ id: a.id, action: "publish", checklist: "on" })));
    const again = await db.article.findUnique({ where: { id: a.id } });
    expect(again.status).toBe("published");
    expect(again.publishedAt.getTime()).toBe(first.getTime());
  });
});
