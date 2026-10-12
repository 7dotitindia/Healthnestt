import { describe, it, expect, beforeEach, vi } from "vitest";
import { db } from "@/lib/db";
import { readSessionUserId } from "@/lib/session";
import { resetDb, makeUser, run } from "../helpers";

// The shared setup replaces @/lib/auth with a stub. Here we want the real one, to check
// that a session is only as good as the account behind it.
const real = await vi.importActual("@/lib/auth");

let admin, writer;
const signedInAs = (user) => vi.mocked(readSessionUserId).mockResolvedValue(user?.id ?? null);

beforeEach(async () => {
  await resetDb();
  admin = await makeUser("admin");
  writer = await makeUser("freelancer");
  signedInAs(null);
});

describe("getCurrentUser", () => {
  it("returns nobody when there is no session", async () => {
    expect(await real.getCurrentUser()).toBeNull();
  });

  it("returns nobody for a session that points at a user that no longer exists", async () => {
    vi.mocked(readSessionUserId).mockResolvedValue("deleted-user-id");
    expect(await real.getCurrentUser()).toBeNull();
  });

  it("returns the user, without the password hash", async () => {
    signedInAs(writer);
    const u = await real.getCurrentUser();
    expect(u.id).toBe(writer.id);
    expect(u.role).toBe("freelancer");
    expect(u).not.toHaveProperty("passwordHash");
  });

  it("stops honouring a session the moment the account is deactivated", async () => {
    signedInAs(writer);
    expect(await real.getCurrentUser()).not.toBeNull();
    await db.user.update({ where: { id: writer.id }, data: { status: "deactivated" } });
    expect(await real.getCurrentUser()).toBeNull();
  });

  it("sees a role change immediately", async () => {
    signedInAs(writer);
    await db.user.update({ where: { id: writer.id }, data: { role: "reader" } });
    expect((await real.getCurrentUser()).role).toBe("reader");
  });
});

describe("route guards", () => {
  it("requireAdmin lets an admin through", async () => {
    signedInAs(admin);
    expect((await real.requireAdmin()).id).toBe(admin.id);
  });

  it("requireAdmin turns a freelancer away", async () => {
    signedInAs(writer);
    expect((await run(() => real.requireAdmin())).redirectTo).toBe("/staff/login");
  });

  it("requireFreelancer turns an admin away (the dashboards are separate)", async () => {
    signedInAs(admin);
    expect((await run(() => real.requireFreelancer())).redirectTo).toBe("/staff/login");
  });

  it("requireStaff accepts admins and freelancers but not readers or visitors", async () => {
    signedInAs(admin);
    expect((await run(() => real.requireStaff())).result.id).toBe(admin.id);
    signedInAs(writer);
    expect((await run(() => real.requireStaff())).result.id).toBe(writer.id);
    const reader = await makeUser("reader");
    signedInAs(reader);
    expect((await run(() => real.requireStaff())).redirectTo).toBe("/staff/login");
    signedInAs(null);
    expect((await run(() => real.requireStaff())).redirectTo).toBe("/staff/login");
  });

  it("every guard rejects a deactivated admin", async () => {
    signedInAs(admin);
    await db.user.update({ where: { id: admin.id }, data: { status: "deactivated" } });
    expect((await run(() => real.requireAdmin())).redirectTo).toBe("/staff/login");
    expect((await run(() => real.requireStaff())).redirectTo).toBe("/staff/login");
  });
});
