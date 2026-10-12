import { describe, it, expect } from "vitest";
import {
  canTransition, canEdit, canView, validateForSubmit, validateForPublish,
} from "@/lib/workflow";

const STATUSES = ["draft", "submitted", "changes_requested", "approved", "published", "archived"];

const admin = { id: "a1", role: "admin" };
const owner = { id: "f1", role: "freelancer" };
const otherWriter = { id: "f2", role: "freelancer" };
const reader = { id: "r1", role: "reader" };
const article = (status) => ({ status, authorId: "f1" });

// Written independently from the code, straight from CONTENT_MODEL_SPEC.md section 4.1.
// Each entry: [from, to, who may do it]
const ALLOWED = [
  ["draft", "submitted", ["owner", "admin"]],
  ["submitted", "changes_requested", ["admin"]],
  ["submitted", "approved", ["admin"]],
  ["submitted", "published", ["admin"]],
  ["changes_requested", "submitted", ["owner", "admin"]],
  ["approved", "published", ["admin"]],
  ["published", "archived", ["admin"]],
  ["published", "draft", ["admin"]],
  ["archived", "published", ["admin"]],
];
const actors = { admin, owner, otherWriter, reader, anonymous: null };

describe("canTransition: full matrix", () => {
  for (const from of STATUSES) {
    for (const to of STATUSES) {
      for (const [name, user] of Object.entries(actors)) {
        const rule = ALLOWED.find(([f, t]) => f === from && t === to);
        const expected = !!rule && rule[2].includes(name);
        it(`${name}: ${from} -> ${to} is ${expected ? "allowed" : "denied"}`, () => {
          expect(canTransition(user, article(from), to)).toBe(expected);
        });
      }
    }
  }
});

describe("canTransition: the rules that matter most", () => {
  it("a freelancer can never publish, in any status", () => {
    for (const s of STATUSES) expect(canTransition(owner, article(s), "published")).toBe(false);
  });
  it("a freelancer cannot move someone else's article", () => {
    expect(canTransition(otherWriter, article("draft"), "submitted")).toBe(false);
    expect(canTransition(otherWriter, article("changes_requested"), "submitted")).toBe(false);
  });
  it("an approved article cannot be sent back for changes (the spec has no such step)", () => {
    expect(canTransition(admin, article("approved"), "changes_requested")).toBe(false);
  });
});

describe("canEdit", () => {
  const cases = [
    // [status, owner, otherWriter, admin, reader]
    ["draft", true, false, true, false],
    ["submitted", false, false, true, false],
    ["changes_requested", true, false, true, false],
    ["approved", false, false, true, false],
    ["published", false, false, true, false],
    ["archived", false, false, true, false],
  ];
  for (const [status, o, ow, a, r] of cases) {
    it(`${status}: owner=${o} other=${ow} admin=${a} reader=${r}`, () => {
      expect(canEdit(owner, article(status))).toBe(o);
      expect(canEdit(otherWriter, article(status))).toBe(ow);
      expect(canEdit(admin, article(status))).toBe(a);
      expect(canEdit(reader, article(status))).toBe(r);
      expect(canEdit(null, article(status))).toBe(false);
    });
  }
});

describe("canView", () => {
  it("anyone can view a published article, including logged-out visitors", () => {
    expect(canView(null, article("published"))).toBe(true);
  });
  it("unpublished articles are visible only to their author and admin", () => {
    for (const s of STATUSES.filter((s) => s !== "published")) {
      expect(canView(null, article(s))).toBe(false);
      expect(canView(reader, article(s))).toBe(false);
      expect(canView(otherWriter, article(s))).toBe(false);
      expect(canView(owner, article(s))).toBe(true);
      expect(canView(admin, article(s))).toBe(true);
    }
  });
});

const goodArticle = {
  title: "A clear and helpful title for a test article",
  excerpt: "A short summary of the article that is comfortably long enough to pass validation.",
  body: `<p>${"word ".repeat(120)}</p>`,
  coverImageUrl: "/uploads/x.png",
  coverImageAlt: "Alt text",
  categoryId: "c1",
  tagCount: 2,
  slug: "a-clear-title",
  seoTitle: "SEO title",
  seoDescription: "SEO description",
};
const goodSource = [{ title: "T", publisher: "WHO", url: "https://who.int/x" }];

describe("validateForSubmit", () => {
  it("passes a complete article", () => {
    expect(validateForSubmit(goodArticle, goodSource)).toEqual([]);
  });
  it.each([
    ["title too short", { title: "Short" }, /Title/],
    ["title too long", { title: "x".repeat(111) }, /Title/],
    ["excerpt too short", { excerpt: "too short" }, /Excerpt/],
    ["excerpt too long", { excerpt: "x".repeat(161) }, /Excerpt/],
    ["body too short", { body: "<p>tiny</p>" }, /Body/],
    ["no cover", { coverImageUrl: null }, /cover image/i],
    ["no alt text", { coverImageAlt: "  " }, /alt text/i],
    ["no category", { categoryId: null }, /category/i],
    ["too many tags", { tagCount: 6 }, /tags/i],
  ])("rejects: %s", (_name, patch, message) => {
    const problems = validateForSubmit({ ...goodArticle, ...patch }, goodSource);
    expect(problems.some((p) => message.test(p))).toBe(true);
  });
  it("requires at least one source", () => {
    expect(validateForSubmit(goodArticle, []).some((p) => /source/i.test(p))).toBe(true);
  });
  it("rejects sources that are not https links", () => {
    for (const url of ["http://who.int/x", "javascript:alert(1)", "ftp://x.com/a", "not a url", ""]) {
      const problems = validateForSubmit(goodArticle, [{ title: "T", publisher: "WHO", url }]);
      expect(problems.some((p) => /source/i.test(p))).toBe(true);
    }
  });
  it("rejects sources missing a title or publisher", () => {
    expect(validateForSubmit(goodArticle, [{ title: "", publisher: "WHO", url: "https://a.com" }]).length).toBeGreaterThan(0);
    expect(validateForSubmit(goodArticle, [{ title: "T", publisher: "", url: "https://a.com" }]).length).toBeGreaterThan(0);
  });
  it("reports every problem at once, not just the first", () => {
    expect(validateForSubmit({}, []).length).toBeGreaterThanOrEqual(6);
  });
});

describe("validateForPublish", () => {
  it("passes a complete article with SEO fields", () => {
    expect(validateForPublish(goodArticle, goodSource)).toEqual([]);
  });
  it("also requires slug, SEO title and SEO description", () => {
    expect(validateForPublish({ ...goodArticle, seoTitle: "" }, goodSource).some((p) => /SEO title/.test(p))).toBe(true);
    expect(validateForPublish({ ...goodArticle, seoDescription: " " }, goodSource).some((p) => /SEO description/.test(p))).toBe(true);
    expect(validateForPublish({ ...goodArticle, slug: "" }, goodSource).some((p) => /Slug/.test(p))).toBe(true);
  });
  it("includes every submit rule too", () => {
    expect(validateForPublish({ ...goodArticle, categoryId: null }, goodSource).some((p) => /category/i.test(p))).toBe(true);
  });
});
