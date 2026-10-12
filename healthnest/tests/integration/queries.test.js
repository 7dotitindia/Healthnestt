import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { getCategoriesWithCounts, getConditionsWithCounts, searchArticles, getPages } from "@/lib/queries";
import { resetDb, makeUser, makeCategory, makeArticle } from "../helpers";

let writer;
beforeEach(async () => {
  await resetDb();
  writer = await makeUser("freelancer");
});

describe("category and condition counts", () => {
  it("count only published articles", async () => {
    const cat = await makeCategory();
    for (const status of ["published", "published", "draft", "submitted", "archived"]) {
      await makeArticle(writer.id, { categoryId: cat.id, status });
    }
    const [row] = await getCategoriesWithCounts();
    expect(row._count.articles).toBe(2);
  });

  it("hide inactive categories and conditions", async () => {
    const live = await makeCategory();
    await makeCategory({ isActive: false });
    await db.condition.create({ data: { name: "Hidden", slug: "hidden", overview: "x".repeat(30), categoryId: live.id, isActive: false } });
    expect((await getCategoriesWithCounts()).length).toBe(1);
    expect((await getConditionsWithCounts()).length).toBe(0);
  });

  it("give each condition its own count and category", async () => {
    const cat = await makeCategory();
    const cond = await db.condition.create({ data: { name: "Anxiety", slug: "anxiety", overview: "x".repeat(30), categoryId: cat.id } });
    await makeArticle(writer.id, { categoryId: cat.id, conditionId: cond.id, status: "published" });
    await makeArticle(writer.id, { categoryId: cat.id, conditionId: cond.id, status: "draft" });
    const [row] = await getConditionsWithCounts();
    expect(row.category.id).toBe(cat.id);
    expect(row._count.articles).toBe(1);
  });
});

describe("searchArticles", () => {
  it("finds published articles by title, summary or body, and never drafts", async () => {
    await makeArticle(writer.id, { title: "Managing blood pressure at home", status: "published" });
    await makeArticle(writer.id, { title: "Sleep and blood sugar", excerpt: "Some blood facts", status: "published" });
    await makeArticle(writer.id, { title: "A secret blood draft", status: "draft" });
    const found = await searchArticles("blood");
    expect(found.map((a) => a.title).sort()).toEqual(["Managing blood pressure at home", "Sleep and blood sugar"]);
  });

  it("can be narrowed to one topic", async () => {
    const heart = await makeCategory({ slug: "heart", name: "Heart" });
    const sleep = await makeCategory({ slug: "sleep", name: "Sleep" });
    await makeArticle(writer.id, { title: "Blood pressure basics", categoryId: heart.id, status: "published" });
    await makeArticle(writer.id, { title: "Blood tests and sleep", categoryId: sleep.id, status: "published" });
    expect((await searchArticles("blood")).length).toBe(2);
    const onlyHeart = await searchArticles("blood", 20, "heart");
    expect(onlyHeart.map((a) => a.title)).toEqual(["Blood pressure basics"]);
    expect(await searchArticles("blood", 20, "no-such-topic")).toEqual([]);
  });

  it("ignores queries that are too short or empty", async () => {
    await makeArticle(writer.id, { title: "Anything at all", status: "published" });
    expect(await searchArticles("a")).toEqual([]);
    expect(await searchArticles("   ")).toEqual([]);
    expect(await searchArticles(undefined)).toEqual([]);
  });

  it("treats quotes and wildcards as plain text", async () => {
    await makeArticle(writer.id, { title: "Normal article", status: "published" });
    for (const q of ["'; DROP TABLE Article; --", "%%", "_%", '" OR 1=1']) {
      expect(await searchArticles(q)).toEqual([]);
    }
    expect(await db.article.count()).toBe(1);
  });
});

describe("getPages (side navigation order)", () => {
  it("lists the policy pages in reading order, then any extras by title", async () => {
    for (const [slug, title] of [["contact", "Contact"], ["zebra", "Zebra"], ["about", "About"], ["privacy", "Privacy"], ["editorial-policy", "Editorial policy"], ["alpha", "Alpha"]]) {
      await db.page.create({ data: { slug, title, body: "x" } });
    }
    expect((await getPages()).map((p) => p.slug)).toEqual(["about", "editorial-policy", "privacy", "contact", "alpha", "zebra"]);
  });
});
