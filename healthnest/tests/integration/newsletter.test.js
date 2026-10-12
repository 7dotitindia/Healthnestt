import { describe, it, expect, beforeEach, vi } from "vitest";
import { db } from "@/lib/db";
import { subscribe } from "@/app/actions/newsletter";
import { resetDb, form } from "../helpers";

// Each test pretends to come from its own IP address, so the per-IP signup limiter
// (5 attempts per 10 minutes) only affects the test that is about the limiter.
let ip = 0;
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": `10.9.0.${ip}` }),
  cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }),
}));

beforeEach(async () => {
  ip += 1;
  await resetDb();
});

describe("newsletter signup", () => {
  it("stores a valid signup as pending, waiting for confirmation", async () => {
    const r = await subscribe(null, form({ email: "reader@example.com", consent: "on", source: "footer" }));
    expect(r.ok).toBe(true);
    expect(await db.newsletterSubscriber.findFirst()).toMatchObject({ email: "reader@example.com", status: "pending", source: "footer" });
  });

  it("requires consent", async () => {
    const r = await subscribe(null, form({ email: "reader@example.com" }));
    expect(r.ok).toBe(false);
    expect(await db.newsletterSubscriber.count()).toBe(0);
  });

  it("rejects an invalid email", async () => {
    const r = await subscribe(null, form({ email: "nope", consent: "on" }));
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/valid email/i);
  });

  it("lowercases the address and treats a repeat signup as a single subscriber", async () => {
    await subscribe(null, form({ email: "Reader@Example.com", consent: "on" }));
    const again = await subscribe(null, form({ email: "reader@example.com", consent: "on" }));
    expect(again.ok).toBe(true);
    expect(await db.newsletterSubscriber.count()).toBe(1);
  });

  it("answers the same way for a new and an existing address, so the list cannot be probed", async () => {
    await subscribe(null, form({ email: "exists@example.com", consent: "on" }));
    const existing = await subscribe(null, form({ email: "exists@example.com", consent: "on" }));
    expect(existing.message).toMatch(/subscribing/i);
  });

  it("stops a flood of signups", async () => {
    let blocked;
    for (let i = 0; i < 6; i++) blocked = await subscribe(null, form({ email: `flood${i}@example.com`, consent: "on" }));
    expect(blocked.ok).toBe(false);
    expect(blocked.message).toMatch(/too many/i);
  });
});
