import { describe, it, expect, beforeEach, vi } from "vitest";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";
import { login } from "@/app/actions/auth";
import { createFreelancer, setUserStatus } from "@/app/actions/users";
import { resetDb, makeUser, loginAs, form, run, TEST_PASSWORD } from "../helpers";

let admin, writer, reader;

beforeEach(async () => {
  await resetDb();
  admin = await makeUser("admin");
  writer = await makeUser("freelancer");
  reader = await makeUser("reader");
  loginAs(null);
  vi.mocked(createSession).mockClear();
});

// NOTE: the login rate limiter is shared inside this file, so keep the number of attempts modest
// and keep the lock-out test last.
describe("login", () => {
  it("signs a freelancer in and sends them to their dashboard", async () => {
    const r = await run(() => login(null, form({ email: writer.email, password: TEST_PASSWORD })));
    expect(r.redirectTo).toBe("/freelancer");
    expect(createSession).toHaveBeenCalledWith(writer.id);
    expect((await db.user.findUnique({ where: { id: writer.id } })).lastLoginAt).toBeInstanceOf(Date);
  });

  it("signs an admin in and sends them to the admin area", async () => {
    const r = await run(() => login(null, form({ email: admin.email, password: TEST_PASSWORD })));
    expect(r.redirectTo).toBe("/admin");
  });

  it("is not case-sensitive for the email", async () => {
    const r = await run(() => login(null, form({ email: `  ${writer.email.toUpperCase()} `, password: TEST_PASSWORD })));
    expect(r.redirectTo).toBe("/freelancer");
  });

  it("gives the same error for a wrong password and an unknown email", async () => {
    const wrong = await run(() => login(null, form({ email: writer.email, password: "wrong-password" })));
    const unknown = await run(() => login(null, form({ email: "nobody@test.local", password: TEST_PASSWORD })));
    expect(wrong.result.error).toBe("Email or password is incorrect.");
    expect(unknown.result).toEqual(wrong.result);
    expect(createSession).not.toHaveBeenCalled();
  });

  it("refuses a deactivated account even with the right password", async () => {
    await db.user.update({ where: { id: writer.id }, data: { status: "deactivated" } });
    const r = await run(() => login(null, form({ email: writer.email, password: TEST_PASSWORD })));
    expect(r.result.error).toBe("Email or password is incorrect.");
    expect(createSession).not.toHaveBeenCalled();
  });

  it("refuses reader accounts: only staff can use the staff login", async () => {
    const r = await run(() => login(null, form({ email: reader.email, password: TEST_PASSWORD })));
    expect(r.result.error).toBe("Email or password is incorrect.");
    expect(createSession).not.toHaveBeenCalled();
  });

  it("rejects a malformed email without touching the database", async () => {
    const r = await run(() => login(null, form({ email: "not-an-email", password: "x" })));
    expect(r.result.error).toBe("Email or password is incorrect.");
  });

  it("locks an email out after repeated failures, even for the right password", async () => {
    const email = writer.email;
    for (let i = 0; i < 8; i++) await run(() => login(null, form({ email, password: "wrong" })));
    const r = await run(() => login(null, form({ email, password: TEST_PASSWORD })));
    expect(r.result.error).toMatch(/too many attempts/i);
    expect(createSession).not.toHaveBeenCalled();
  });
});

describe("createFreelancer", () => {
  const good = { name: "New Writer", email: "new@test.local", password: "StrongPass1234" };

  it("lets an admin create a freelancer with a hashed password", async () => {
    loginAs(admin);
    const r = await run(() => createFreelancer(null, form(good)));
    expect(r.result.ok).toBe(true);
    const u = await db.user.findUnique({ where: { email: "new@test.local" } });
    expect(u.role).toBe("freelancer");
    expect(u.status).toBe("active");
    expect(u.passwordHash).not.toContain("StrongPass1234");
    expect(await bcrypt.compare("StrongPass1234", u.passwordHash)).toBe(true);
  });

  it("never creates anything other than a freelancer", async () => {
    loginAs(admin);
    await run(() => createFreelancer(null, form({ ...good, role: "admin" })));
    expect((await db.user.findUnique({ where: { email: "new@test.local" } })).role).toBe("freelancer");
  });

  it.each([
    ["a freelancer", () => loginAs(writer)],
    ["a reader", () => loginAs(reader)],
    ["a logged-out visitor", () => loginAs(null)],
  ])("refuses %s", async (_who, login) => {
    login();
    const before = await db.user.count();
    const r = await run(() => createFreelancer(null, form(good)));
    expect(r.redirectTo).toBe("/staff/login");
    expect(await db.user.count()).toBe(before);
  });

  it.each([
    ["too short", "Ab1"],
    ["no number", "OnlyLettersHere"],
    ["no letter", "1234567890123"],
  ])("rejects a weak password (%s)", async (_n, password) => {
    loginAs(admin);
    const r = await run(() => createFreelancer(null, form({ ...good, password })));
    expect(r.result.ok).toBe(false);
    expect(await db.user.findUnique({ where: { email: good.email } })).toBeNull();
  });

  it("rejects a duplicate email and a bad email", async () => {
    loginAs(admin);
    const dup = await run(() => createFreelancer(null, form({ ...good, email: writer.email })));
    expect(dup.result.message).toMatch(/already registered/i);
    const bad = await run(() => createFreelancer(null, form({ ...good, email: "nope" })));
    expect(bad.result.ok).toBe(false);
  });

  it("gives two writers with the same name different author URLs", async () => {
    loginAs(admin);
    await run(() => createFreelancer(null, form({ ...good, email: "a@test.local" })));
    await run(() => createFreelancer(null, form({ ...good, email: "b@test.local" })));
    const slugs = (await db.user.findMany({ where: { name: "New Writer" } })).map((u) => u.slug).sort();
    expect(slugs).toEqual(["new-writer", "new-writer-2"]);
  });
});

describe("setUserStatus", () => {
  const status = async (id) => (await db.user.findUnique({ where: { id } })).status;

  it("lets an admin deactivate and reactivate a freelancer", async () => {
    loginAs(admin);
    await setUserStatus(form({ id: writer.id, status: "deactivated" }));
    expect(await status(writer.id)).toBe("deactivated");
    await setUserStatus(form({ id: writer.id, status: "active" }));
    expect(await status(writer.id)).toBe("active");
  });

  it("does not let an admin lock themselves out", async () => {
    loginAs(admin);
    await setUserStatus(form({ id: admin.id, status: "deactivated" }));
    expect(await status(admin.id)).toBe("active");
  });

  it("only acts on freelancers, never on other admins", async () => {
    const other = await makeUser("admin");
    loginAs(admin);
    await setUserStatus(form({ id: other.id, status: "deactivated" }));
    expect(await status(other.id)).toBe("active");
  });

  it("refuses a freelancer trying to deactivate a colleague", async () => {
    const colleague = await makeUser("freelancer");
    loginAs(writer);
    const r = await run(() => setUserStatus(form({ id: colleague.id, status: "deactivated" })));
    expect(r.redirectTo).toBe("/staff/login");
    expect(await status(colleague.id)).toBe("active");
  });
});
