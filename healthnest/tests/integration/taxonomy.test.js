import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { saveCategory, deleteCategory, saveCondition, deleteCondition } from "@/app/actions/taxonomy";
import { resetDb, makeUser, makeCategory, makeArticle, loginAs, form, run } from "../helpers";

let admin, writer;
const DESC = "A valid description that is long enough to pass.";

beforeEach(async () => {
  await resetDb();
  admin = await makeUser("admin");
  writer = await makeUser("freelancer");
  loginAs(admin);
});

describe("categories: who may manage them", () => {
  it.each([
    ["a freelancer", () => loginAs(writer)],
    ["a logged-out visitor", () => loginAs(null)],
  ])("refuses %s", async (_w, login) => {
    login();
    const r = await run(() => saveCategory(null, form({ name: "Eye Health", description: DESC })));
    expect(r.redirectTo).toBe("/staff/login");
    expect(await db.category.count()).toBe(0);
    const cat = await makeCategory();
    const d = await run(() => deleteCategory(form({ id: cat.id })));
    expect(d.redirectTo).toBe("/staff/login");
    expect(await db.category.count()).toBe(1);
  });
});

describe("saveCategory", () => {
  it("creates a category and builds the slug from the name", async () => {
    const r = await run(() => saveCategory(null, form({ name: "Eye Health", description: DESC, position: "3", isActive: "on" })));
    expect(r.redirectTo).toBe("/admin/categories?created=Eye%20Health");
    expect(await db.category.findFirst()).toMatchObject({ name: "Eye Health", slug: "eye-health", position: 3, isActive: true });
  });

  it("tidies a typed slug instead of storing it as typed", async () => {
    await run(() => saveCategory(null, form({ name: "Eye Health", slug: "Bad Slug!", description: DESC })));
    expect((await db.category.findFirst()).slug).toBe("bad-slug");
  });

  it("saves it as inactive when the box is unticked", async () => {
    await run(() => saveCategory(null, form({ name: "Eye Health", description: DESC })));
    expect((await db.category.findFirst()).isActive).toBe(false);
  });

  it.each(["admin", "freelancer", "staff", "search", "tools", "conditions", "articles", "authors", "api", "uploads"])(
    "refuses the reserved slug %s",
    async (slug) => {
      const r = await run(() => saveCategory(null, form({ name: "Something", slug, description: DESC })));
      expect(r.result.errors[0]).toMatch(/reserved/i);
      expect(await db.category.count()).toBe(0);
    },
  );

  it("refuses a slug already used by a static page", async () => {
    await db.page.create({ data: { title: "About", slug: "about", body: "x" } });
    const r = await run(() => saveCategory(null, form({ name: "About Us", slug: "about", description: DESC })));
    expect(r.result.errors[0]).toMatch(/static page/i);
  });

  it("refuses a duplicate slug and a duplicate name", async () => {
    await makeCategory({ name: "Diabetes", slug: "diabetes" });
    const dupSlug = await run(() => saveCategory(null, form({ name: "Other", slug: "diabetes", description: DESC })));
    expect(dupSlug.result.errors[0]).toMatch(/slug/i);
    const dupName = await run(() => saveCategory(null, form({ name: "Diabetes", slug: "diabetes-2", description: DESC })));
    expect(dupName.result.errors[0]).toMatch(/name/i);
    expect(await db.category.count()).toBe(1);
  });

  it("validates name, description and position", async () => {
    const short = await run(() => saveCategory(null, form({ name: "X", description: DESC })));
    expect(short.result.errors.join(" ")).toMatch(/Name/);
    const desc = await run(() => saveCategory(null, form({ name: "Valid Name", description: "too short" })));
    expect(desc.result.errors.join(" ")).toMatch(/Description/);
    const pos = await run(() => saveCategory(null, form({ name: "Valid Name", description: DESC, position: "abc" })));
    expect(pos.result.errors.length).toBeGreaterThan(0);
    expect(await db.category.count()).toBe(0);
  });

  it("lets the slug change while a category has no articles", async () => {
    const c = await makeCategory({ name: "Old", slug: "old" });
    await run(() => saveCategory(null, form({ id: c.id, name: "Old", slug: "renamed", description: DESC, isActive: "on" })));
    expect((await db.category.findUnique({ where: { id: c.id } })).slug).toBe("renamed");
  });

  it("locks the slug once the category has articles", async () => {
    const c = await makeCategory({ name: "Live", slug: "live" });
    await makeArticle(writer.id, { categoryId: c.id });
    await run(() => saveCategory(null, form({ id: c.id, name: "Live Renamed", slug: "something-else", description: DESC, isActive: "on" })));
    const after = await db.category.findUnique({ where: { id: c.id } });
    expect(after.slug).toBe("live");
    expect(after.name).toBe("Live Renamed");
  });

  it("can deactivate a category that has articles without deleting anything", async () => {
    const c = await makeCategory();
    const a = await makeArticle(writer.id, { categoryId: c.id });
    await run(() => saveCategory(null, form({ id: c.id, name: c.name, description: DESC })));
    expect((await db.category.findUnique({ where: { id: c.id } })).isActive).toBe(false);
    expect((await db.article.findUnique({ where: { id: a.id } })).categoryId).toBe(c.id);
  });
});

describe("deleteCategory", () => {
  it("deletes an empty category", async () => {
    const c = await makeCategory();
    const r = await run(() => deleteCategory(form({ id: c.id })));
    expect(r.redirectTo).toMatch(/deleted=/);
    expect(await db.category.count()).toBe(0);
  });

  it("refuses when the category has articles", async () => {
    const c = await makeCategory();
    await makeArticle(writer.id, { categoryId: c.id });
    const r = await run(() => deleteCategory(form({ id: c.id })));
    expect(r.redirectTo).toBe("/admin/categories?blocked=1");
    expect(await db.category.count()).toBe(1);
  });

  it("refuses when the category has conditions", async () => {
    const c = await makeCategory();
    await db.condition.create({ data: { name: "Cond", slug: "cond", overview: "x".repeat(30), categoryId: c.id } });
    const r = await run(() => deleteCategory(form({ id: c.id })));
    expect(r.redirectTo).toBe("/admin/categories?blocked=1");
    expect(await db.category.count()).toBe(1);
  });
});

describe("conditions", () => {
  const OVERVIEW = "An overview of the condition written in plain language.";
  let cat;
  beforeEach(async () => {
    cat = await makeCategory();
  });

  it("refuses non-admins", async () => {
    loginAs(writer);
    const r = await run(() => saveCondition(null, form({ name: "Anxiety", overview: OVERVIEW, categoryId: cat.id })));
    expect(r.redirectTo).toBe("/staff/login");
    expect(await db.condition.count()).toBe(0);
  });

  it("creates a condition under a category", async () => {
    const r = await run(() => saveCondition(null, form({ name: "Type 2 Diabetes", overview: OVERVIEW, categoryId: cat.id, isActive: "on" })));
    expect(r.redirectTo).toMatch(/created=/);
    expect(await db.condition.findFirst()).toMatchObject({ slug: "type-2-diabetes", categoryId: cat.id, isActive: true });
  });

  it("refuses an unknown category, a duplicate slug, a duplicate name and a short overview", async () => {
    const noCat = await run(() => saveCondition(null, form({ name: "Anxiety", overview: OVERVIEW, categoryId: "missing" })));
    expect(noCat.result.errors[0]).toMatch(/category/i);
    await db.condition.create({ data: { name: "Anxiety", slug: "anxiety", overview: OVERVIEW, categoryId: cat.id } });
    const dupSlug = await run(() => saveCondition(null, form({ name: "Other", slug: "anxiety", overview: OVERVIEW, categoryId: cat.id })));
    expect(dupSlug.result.errors[0]).toMatch(/slug/i);
    const dupName = await run(() => saveCondition(null, form({ name: "Anxiety", slug: "anxiety-2", overview: OVERVIEW, categoryId: cat.id })));
    expect(dupName.result.errors[0]).toMatch(/name/i);
    const short = await run(() => saveCondition(null, form({ name: "Valid", overview: "short", categoryId: cat.id })));
    expect(short.result.errors.join(" ")).toMatch(/Overview/);
    expect(await db.condition.count()).toBe(1);
  });

  it("locks the slug when articles use the condition", async () => {
    const c = await db.condition.create({ data: { name: "Anxiety", slug: "anxiety", overview: OVERVIEW, categoryId: cat.id } });
    await makeArticle(writer.id, { conditionId: c.id });
    await run(() => saveCondition(null, form({ id: c.id, name: "Anxiety", slug: "changed", overview: OVERVIEW, categoryId: cat.id, isActive: "on" })));
    expect((await db.condition.findUnique({ where: { id: c.id } })).slug).toBe("anxiety");
  });

  it("deletes an unused condition but refuses one with articles", async () => {
    const used = await db.condition.create({ data: { name: "Used", slug: "used", overview: OVERVIEW, categoryId: cat.id } });
    const free = await db.condition.create({ data: { name: "Free", slug: "free", overview: OVERVIEW, categoryId: cat.id } });
    await makeArticle(writer.id, { conditionId: used.id });
    expect((await run(() => deleteCondition(form({ id: used.id })))).redirectTo).toBe("/admin/conditions?blocked=1");
    expect((await run(() => deleteCondition(form({ id: free.id })))).redirectTo).toMatch(/deleted=/);
    expect((await db.condition.findMany()).map((c) => c.slug)).toEqual(["used"]);
  });
});
