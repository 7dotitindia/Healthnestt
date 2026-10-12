import { describe, it, expect, beforeEach, vi } from "vitest";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/session";
import { signup, loginReader, logoutReader, updateProfile, toggleBookmark } from "@/app/actions/readers";
import { login } from "@/app/actions/auth";
import { getBookmarkedArticles, isArticleBookmarked } from "@/lib/queries";
import { safeNext } from "@/lib/safeNext";
import { RESERVED_SLUGS } from "@/lib/taxonomy";
import { resetDb, makeUser, makeArticle, loginAs, form, run, TEST_PASSWORD } from "../helpers";

// Every test pretends to come from its own IP address so the per-IP limiters only affect the tests about them.
let ip = 0;
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": `10.8.0.${ip}` }),
  cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }),
}));

const published = (authorId, extra = {}) => makeArticle(authorId, { status: "published", publishedAt: new Date(), ...extra });
const good = { name: "Asha Rao", email: "asha@example.com", password: "Sunrise-2026" };

beforeEach(async () => {
  ip += 1;
  vi.mocked(createSession).mockClear();
  vi.mocked(destroySession).mockClear();
  await resetDb();
  loginAs(null);
});

describe("signup", () => {
  it("creates a reader, signs them in and sends them to their account", async () => {
    const r = await run(() => signup(null, form(good)));
    expect(r.redirectTo).toBe("/account");
    const user = await db.user.findUnique({ where: { email: "asha@example.com" } });
    expect(user).toMatchObject({ name: "Asha Rao", role: "reader", status: "active", slug: "asha-rao" });
    expect(user.passwordHash).not.toContain("Sunrise");
    expect(createSession).toHaveBeenCalledWith(user.id);
  });

  it("never creates anything but a reader, whatever the form says", async () => {
    await run(() => signup(null, form({ ...good, role: "admin" })));
    expect((await db.user.findFirst()).role).toBe("reader");
  });

  it("lowercases the email and gives people with the same name different slugs", async () => {
    await run(() => signup(null, form({ ...good, email: "ASHA@Example.com" })));
    await run(() => signup(null, form({ ...good, email: "asha2@example.com" })));
    const users = await db.user.findMany({ orderBy: { createdAt: "asc" } });
    expect(users.map((u) => u.email)).toEqual(["asha@example.com", "asha2@example.com"]);
    expect(users.map((u) => u.slug)).toEqual(["asha-rao", "asha-rao-2"]);
  });

  it("goes back to the page the person came from, but only a page on this site", async () => {
    expect((await run(() => signup(null, form({ ...good, next: "/articles/hello" })))).redirectTo).toBe("/articles/hello");
    expect((await run(() => signup(null, form({ ...good, email: "b@example.com", next: "https://evil.example" })))).redirectTo).toBe("/account");
  });

  it.each([
    ["a short password", { password: "abc12" }, /8 characters/],
    ["a password with no number", { password: "onlyletters" }, /number/],
    ["a password with no letter", { password: "12345678" }, /letter/],
    ["an invalid email", { email: "nope" }, /valid email/i],
    ["a missing name", { name: " " }, /name/i],
  ])("rejects %s", async (_label, change, message) => {
    const r = await run(() => signup(null, form({ ...good, ...change })));
    expect(r.result.error).toMatch(message);
    expect(await db.user.count()).toBe(0);
    expect(createSession).not.toHaveBeenCalled();
  });

  it("refuses an email that is already registered and does not touch the existing account", async () => {
    const existing = await makeUser("freelancer", { email: "asha@example.com" });
    const r = await run(() => signup(null, form(good)));
    expect(r.result.error).toMatch(/sign in/i);
    expect(await db.user.count()).toBe(1);
    expect((await db.user.findUnique({ where: { id: existing.id } })).role).toBe("freelancer");
    expect(createSession).not.toHaveBeenCalled();
  });

  it("limits how many accounts one connection can create in an hour", async () => {
    for (let i = 0; i < 5; i++) await run(() => signup(null, form({ ...good, email: `r${i}@example.com` })));
    const sixth = await run(() => signup(null, form({ ...good, email: "r6@example.com" })));
    expect(sixth.result.error).toMatch(/too many/i);
    expect(await db.user.count()).toBe(5);
  });
});

describe("reader sign-in", () => {
  it("signs a reader in and sends them to the page they wanted", async () => {
    const reader = await makeUser("reader", { email: "r@example.com" });
    const r = await run(() => loginReader(null, form({ email: "r@example.com", password: TEST_PASSWORD, next: "/articles/x" })));
    expect(r.redirectTo).toBe("/articles/x");
    expect(createSession).toHaveBeenCalledWith(reader.id);
    expect((await db.user.findUnique({ where: { id: reader.id } })).lastLoginAt).not.toBeNull();
  });

  it("sends staff to their own dashboard, not to a requested page", async () => {
    await makeUser("admin", { email: "a@example.com" });
    await makeUser("freelancer", { email: "w@example.com" });
    expect((await run(() => loginReader(null, form({ email: "a@example.com", password: TEST_PASSWORD, next: "/articles/x" })))).redirectTo).toBe("/admin");
    expect((await run(() => loginReader(null, form({ email: "w@example.com", password: TEST_PASSWORD })))).redirectTo).toBe("/freelancer");
  });

  it("refuses a bad email or password with the same message, and signs nobody in", async () => {
    await makeUser("reader", { email: "r@example.com" });
    const wrong = await run(() => loginReader(null, form({ email: "r@example.com", password: "Wrong-pass-1" })));
    const unknown = await run(() => loginReader(null, form({ email: "nobody@example.com", password: "Wrong-pass-1" })));
    expect(wrong.result.error).toBe(unknown.result.error);
    expect(createSession).not.toHaveBeenCalled();
  });

  it("refuses a deactivated account", async () => {
    await makeUser("reader", { email: "r@example.com", status: "deactivated" });
    const r = await run(() => loginReader(null, form({ email: "r@example.com", password: TEST_PASSWORD })));
    expect(r.result.error).toBeTruthy();
    expect(createSession).not.toHaveBeenCalled();
  });

  it("locks out repeated wrong passwords for one email", async () => {
    await makeUser("reader", { email: "r@example.com" });
    for (let i = 0; i < 8; i++) await run(() => loginReader(null, form({ email: "r@example.com", password: "Wrong-pass-1" })));
    const locked = await run(() => loginReader(null, form({ email: "r@example.com", password: TEST_PASSWORD })));
    expect(locked.result.error).toMatch(/too many/i);
  });

  it("keeps the staff sign-in page closed to readers", async () => {
    await makeUser("reader", { email: "r@example.com" });
    const r = await run(() => login(null, form({ email: "r@example.com", password: TEST_PASSWORD })));
    expect(r.result.error).toBeTruthy();
    expect(createSession).not.toHaveBeenCalled();
  });

  it("signs out and goes to the home page", async () => {
    const r = await run(() => logoutReader());
    expect(r.redirectTo).toBe("/");
    expect(destroySession).toHaveBeenCalled();
  });
});

describe("profile", () => {
  it("lets a signed-in person change their name", async () => {
    const reader = await makeUser("reader");
    loginAs(reader);
    const r = await updateProfile(null, form({ name: "  New Name " }));
    expect(r.ok).toBe(true);
    expect((await db.user.findUnique({ where: { id: reader.id } })).name).toBe("New Name");
  });

  it("rejects an empty name, and a signed-out visit goes to sign in", async () => {
    const reader = await makeUser("reader");
    loginAs(reader);
    expect((await updateProfile(null, form({ name: " " }))).ok).toBe(false);
    loginAs(null);
    expect((await run(() => updateProfile(null, form({ name: "Someone" })))).redirectTo).toMatch(/^\/login/);
  });
});

describe("bookmarks", () => {
  it("asks a signed-out visitor to sign in and saves nothing", async () => {
    const author = await makeUser("freelancer");
    const a = await published(author.id);
    expect(await toggleBookmark(a.id)).toMatchObject({ ok: false, needsLogin: true });
    expect(await db.bookmark.count()).toBe(0);
  });

  it("saves a published article, then removes it on the second press", async () => {
    const author = await makeUser("freelancer");
    const reader = await makeUser("reader");
    const a = await published(author.id);
    loginAs(reader);
    expect(await toggleBookmark(a.id)).toEqual({ ok: true, saved: true });
    expect(await isArticleBookmarked(reader.id, a.id)).toBe(true);
    expect(await toggleBookmark(a.id)).toEqual({ ok: true, saved: false });
    expect(await isArticleBookmarked(reader.id, a.id)).toBe(false);
  });

  it("will not save a draft, an unknown id, or something that is not an id", async () => {
    const author = await makeUser("freelancer");
    const reader = await makeUser("reader");
    const draft = await makeArticle(author.id);
    loginAs(reader);
    expect((await toggleBookmark(draft.id)).ok).toBe(false);
    expect((await toggleBookmark("does-not-exist")).ok).toBe(false);
    expect((await toggleBookmark({ $ne: "" })).ok).toBe(false);
    expect(await db.bookmark.count()).toBe(0);
  });

  it("keeps each person's saved list private, newest first, and hides unpublished articles", async () => {
    const author = await makeUser("freelancer");
    const me = await makeUser("reader");
    const other = await makeUser("reader");
    const first = await published(author.id);
    const second = await published(author.id);
    loginAs(me);
    await toggleBookmark(first.id);
    await toggleBookmark(second.id);
    loginAs(other);
    await toggleBookmark(first.id);

    expect((await getBookmarkedArticles(me.id)).map((a) => a.id)).toEqual([second.id, first.id]);
    expect((await getBookmarkedArticles(other.id)).map((a) => a.id)).toEqual([first.id]);

    await db.article.update({ where: { id: second.id }, data: { status: "archived" } });
    expect((await getBookmarkedArticles(me.id)).map((a) => a.id)).toEqual([first.id]);
  });

  it("removes bookmarks along with the article or the account", async () => {
    const author = await makeUser("freelancer");
    const reader = await makeUser("reader");
    const a = await published(author.id);
    const b = await published(author.id);
    loginAs(reader);
    await toggleBookmark(a.id);
    await toggleBookmark(b.id);
    await db.article.delete({ where: { id: a.id } });
    expect(await db.bookmark.count()).toBe(1);
    await db.user.delete({ where: { id: reader.id } });
    expect(await db.bookmark.count()).toBe(0);
  });
});

describe("safeNext", () => {
  it.each([
    ["/articles/hello", "/articles/hello"],
    ["/search?q=sleep", "/search?q=sleep"],
    ["https://evil.example", "/account"],
    ["//evil.example", "/account"],
    ["/\\evil.example", "/account"],
    ["javascript:alert(1)", "/account"],
    ["/ok\nSet-Cookie: x=1", "/account"],
    [undefined, "/account"],
    [["/a"], "/account"],
  ])("maps %j to %j", (input, expected) => {
    expect(safeNext(input)).toBe(expected);
  });

  it("uses the fallback it is given", () => {
    expect(safeNext("//x", "/")).toBe("/");
  });
});

describe("reserved addresses", () => {
  it("keeps account pages from being taken by a category", () => {
    for (const slug of ["login", "signup", "account", "logout"]) expect(RESERVED_SLUGS.has(slug)).toBe(true);
  });
});
