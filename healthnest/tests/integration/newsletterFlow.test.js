import { describe, it, expect, beforeEach, vi } from "vitest";
import { db } from "@/lib/db";
import { subscribe, confirmSubscription, unsubscribe } from "@/app/actions/newsletter";
import { isConfirmationExpired } from "@/lib/newsletterState";
import { resetDb, form, run } from "../helpers";

// Each test comes from its own IP, so the per-IP signup limit does not leak between tests.
let ip = 0;
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": `10.8.0.${ip}` }),
  cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }),
}));

beforeEach(async () => {
  ip += 1;
  await resetDb();
});

const signup = (email = "reader@example.com") => subscribe(null, form({ email, consent: "on", source: "test" }));
const sub = (email = "reader@example.com") => db.newsletterSubscriber.findUnique({ where: { email } });
const confirmEmails = (email = "reader@example.com") => db.emailLog.findMany({ where: { to: email, kind: "newsletter_confirm" }, orderBy: { createdAt: "asc" } });
const age = (email, ms) => db.newsletterSubscriber.update({ where: { email }, data: { consentAt: new Date(Date.now() - ms) } });
const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;

describe("signing up", () => {
  it("creates a pending subscriber and emails one confirmation link", async () => {
    const r = await signup();
    expect(r.ok).toBe(true);
    const s = await sub();
    expect(s.status).toBe("pending");
    expect(s.token).toMatch(/^[a-f0-9]{64}$/);
    const mails = await confirmEmails();
    expect(mails).toHaveLength(1);
    expect(mails[0].html).toContain(`/newsletter/confirm?token=${s.token}`);
    expect(mails[0].text).toContain(`/newsletter/confirm?token=${s.token}`);
  });

  it("gives every visitor the same reply, whether or not the address is already on the list", async () => {
    const first = await signup("a@example.com");
    await db.newsletterSubscriber.update({ where: { email: "a@example.com" }, data: { status: "confirmed" } });
    const again = await signup("a@example.com");
    const fresh = await signup("b@example.com");
    expect(again).toEqual(first);
    expect(fresh).toEqual(first);
  });

  it("does not send a second email within 10 minutes", async () => {
    await signup();
    await signup();
    await signup();
    expect(await confirmEmails()).toHaveLength(1);
  });

  it("sends a fresh link after 10 minutes, and the old link stops working", async () => {
    await signup();
    const oldToken = (await sub()).token;
    await age("reader@example.com", 11 * MIN);
    await signup();
    const s = await sub();
    expect(s.token).not.toBe(oldToken);
    expect(await confirmEmails()).toHaveLength(2);
    expect((await run(() => confirmSubscription(form({ token: oldToken })))).redirectTo).toBe("/newsletter/confirm?state=invalid");
  });

  it("caps confirmation emails to one inbox at 3 an hour, however many people ask", async () => {
    await signup();
    for (let i = 0; i < 5; i++) {
      await age("reader@example.com", 11 * MIN);
      await signup();
    }
    expect(await confirmEmails()).toHaveLength(3);
  });

  it("sends nothing to someone who is already confirmed", async () => {
    await signup();
    await db.newsletterSubscriber.update({ where: { email: "reader@example.com" }, data: { status: "confirmed" } });
    await db.emailLog.deleteMany();
    await signup();
    expect(await db.emailLog.count()).toBe(0);
    expect((await sub()).status).toBe("confirmed");
  });

  it("lets an unsubscribed person sign up again", async () => {
    await signup();
    await db.newsletterSubscriber.update({ where: { email: "reader@example.com" }, data: { status: "unsubscribed", unsubscribedAt: new Date() } });
    await db.emailLog.deleteMany();
    await signup();
    expect((await sub()).status).toBe("pending");
    expect((await sub()).unsubscribedAt).toBeNull();
    expect(await confirmEmails()).toHaveLength(1);
  });

  it("sends nothing when consent is missing or the address is invalid", async () => {
    await subscribe(null, form({ email: "reader@example.com" }));
    await subscribe(null, form({ email: "nope", consent: "on" }));
    expect(await db.emailLog.count()).toBe(0);
  });
});

describe("confirming", () => {
  it("confirms a pending subscriber with a valid link", async () => {
    await signup();
    const { token } = await sub();
    const r = await run(() => confirmSubscription(form({ token })));
    expect(r.redirectTo).toBe("/newsletter/confirm?state=done");
    const s = await sub();
    expect(s.status).toBe("confirmed");
    expect(s.confirmedAt).toBeInstanceOf(Date);
  });

  it("is harmless to confirm twice", async () => {
    await signup();
    const { token } = await sub();
    await run(() => confirmSubscription(form({ token })));
    const again = await run(() => confirmSubscription(form({ token })));
    expect(again.redirectTo).toBe("/newsletter/confirm?state=done");
    expect((await sub()).status).toBe("confirmed");
  });

  it("refuses an expired link (older than 7 days) and leaves the subscriber pending", async () => {
    await signup();
    const { token } = await sub();
    await age("reader@example.com", 8 * DAY);
    const r = await run(() => confirmSubscription(form({ token })));
    expect(r.redirectTo).toBe("/newsletter/confirm?state=expired");
    expect((await sub()).status).toBe("pending");
  });

  it.each([["", "empty"], ["short", "too short"], ["x".repeat(200), "too long"], ["a b c d e f g h i j k l m n o p", "spaces"], ["../../etc/passwd" + "a".repeat(20), "path-like"], ["' OR 1=1 --" + "a".repeat(20), "SQL-like"]])(
    "rejects a bad token (%#: %s)",
    async (token) => {
      await signup();
      const r = await run(() => confirmSubscription(form({ token })));
      expect(r.redirectTo).toBe("/newsletter/confirm?state=invalid");
      expect((await sub()).status).toBe("pending");
    },
  );

  it("rejects a well-formed token that matches nobody, and an unsubscribed person's token", async () => {
    expect((await run(() => confirmSubscription(form({ token: "a".repeat(64) })))).redirectTo).toBe("/newsletter/confirm?state=invalid");
    await signup();
    const { token } = await sub();
    await db.newsletterSubscriber.update({ where: { email: "reader@example.com" }, data: { status: "unsubscribed" } });
    expect((await run(() => confirmSubscription(form({ token })))).redirectTo).toBe("/newsletter/confirm?state=invalid");
    expect((await sub()).status).toBe("unsubscribed");
  });
});

describe("unsubscribing", () => {
  it("unsubscribes a confirmed subscriber", async () => {
    await signup();
    const { token } = await sub();
    await run(() => confirmSubscription(form({ token })));
    const r = await run(() => unsubscribe(form({ token })));
    expect(r.redirectTo).toBe("/newsletter/unsubscribe?state=done");
    const s = await sub();
    expect(s.status).toBe("unsubscribed");
    expect(s.unsubscribedAt).toBeInstanceOf(Date);
  });

  it("works for someone who never confirmed, and twice in a row", async () => {
    await signup();
    const { token } = await sub();
    await run(() => unsubscribe(form({ token })));
    const again = await run(() => unsubscribe(form({ token })));
    expect(again.redirectTo).toBe("/newsletter/unsubscribe?state=done");
    expect((await sub()).status).toBe("unsubscribed");
  });

  it("refuses a bad or unknown token and changes nobody", async () => {
    await signup();
    for (const token of ["bad", "z".repeat(64), ""]) {
      expect((await run(() => unsubscribe(form({ token })))).redirectTo).toBe("/newsletter/unsubscribe?state=invalid");
    }
    expect((await sub()).status).toBe("pending");
  });
});

describe("isConfirmationExpired", () => {
  it("is false inside 7 days and true after", () => {
    const now = Date.now();
    expect(isConfirmationExpired(new Date(now - 6 * DAY), now)).toBe(false);
    expect(isConfirmationExpired(new Date(now - 8 * DAY), now)).toBe(true);
  });
});
