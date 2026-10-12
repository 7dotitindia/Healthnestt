import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { db } from "@/lib/db";
import { sendEmail, emailConfig, oneLine } from "@/lib/email";
import {
  esc, absolute, confirmSubscriptionEmail, articleSubmittedEmail, changesRequestedEmail, articlePublishedEmail,
} from "@/lib/emailTemplates";
import { sendTestEmail } from "@/app/actions/emails";
import { resetDb, makeUser, loginAs, run } from "../helpers";

beforeEach(resetDb);
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const mail = (over = {}) => ({ to: "reader@example.com", subject: "Hello", html: "<p>Hi</p>", text: "Hi", kind: "test", ...over });
const useResend = (fetchImpl) => {
  vi.stubEnv("EMAIL_PROVIDER", "resend");
  vi.stubEnv("RESEND_API_KEY", "re_test_key_123");
  vi.stubGlobal("fetch", fetchImpl);
};
const okResponse = (body = { id: "prov_1" }) => ({ ok: true, status: 200, json: async () => body });

describe("sendEmail: log mode (the default)", () => {
  it("saves the email to the log and sends nothing", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const r = await sendEmail(mail());
    expect(r).toMatchObject({ ok: true, status: "logged" });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(await db.emailLog.findFirst()).toMatchObject({ to: "reader@example.com", subject: "Hello", provider: "log", status: "logged", kind: "test" });
  });

  it("lower-cases the address and rejects ones that are not addresses", async () => {
    await sendEmail(mail({ to: "  Reader@Example.COM " }));
    expect((await db.emailLog.findFirst()).to).toBe("reader@example.com");
    for (const bad of ["nope", "a@b", "a b@c.com", "x@y.com, z@w.com", "<a@b.com>", ""]) {
      const r = await sendEmail(mail({ to: bad }));
      expect(r.ok).toBe(false);
    }
    expect(await db.emailLog.count({ where: { status: "failed" } })).toBe(6);
  });

  it("collapses line breaks in the subject so headers cannot be injected", async () => {
    await sendEmail(mail({ subject: "Hi\r\nBcc: victim@example.com\nX-Evil: 1" }));
    const s = (await db.emailLog.findFirst()).subject;
    expect(s).not.toMatch(/[\r\n]/);
    expect(s).toBe("Hi Bcc: victim@example.com X-Evil: 1");
    expect(oneLine("a b c")).toBe("a b c");
  });

  it("trims very long subjects", async () => {
    await sendEmail(mail({ subject: "x".repeat(500) }));
    expect((await db.emailLog.findFirst()).subject.length).toBe(200);
  });

  it("falls back to the log, and says so, when Resend is chosen without a key", () => {
    vi.stubEnv("EMAIL_PROVIDER", "resend");
    vi.stubEnv("RESEND_API_KEY", "");
    expect(emailConfig()).toMatchObject({ provider: "log", misconfigured: true });
  });
});

describe("sendEmail: Resend mode", () => {
  it("calls the Resend API with the key, and records it as sent", async () => {
    const fetchSpy = vi.fn(async () => okResponse());
    useResend(fetchSpy);
    const r = await sendEmail(mail());
    expect(r).toMatchObject({ ok: true, status: "sent" });
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer re_test_key_123");
    expect(JSON.parse(init.body)).toMatchObject({ to: ["reader@example.com"], subject: "Hello", html: "<p>Hi</p>", text: "Hi" });
    expect(JSON.parse(init.body).from).toContain("test@healthnestt.local");
    expect(await db.emailLog.findFirst()).toMatchObject({ provider: "resend", status: "sent", providerId: "prov_1" });
  });

  it("records a provider error without throwing, and keeps the key out of the log", async () => {
    useResend(vi.fn(async () => ({ ok: false, status: 422, json: async () => ({ message: "The from domain is not verified." }) })));
    const r = await sendEmail(mail());
    expect(r).toMatchObject({ ok: false, status: "failed", error: "The from domain is not verified." });
    const row = await db.emailLog.findFirst();
    expect(row.status).toBe("failed");
    expect(JSON.stringify(row)).not.toContain("re_test_key_123");
  });

  it("copes with a network failure and a timeout", async () => {
    useResend(vi.fn(async () => { throw new TypeError("fetch failed"); }));
    expect((await sendEmail(mail())).error).toMatch(/could not reach/i);
    useResend(vi.fn(async () => { throw Object.assign(new Error("aborted"), { name: "AbortError" }); }));
    expect((await sendEmail(mail())).error).toMatch(/did not answer in time/i);
  });

  it("copes with a provider reply that is not JSON", async () => {
    useResend(vi.fn(async () => ({ ok: false, status: 502, json: async () => { throw new Error("bad json"); } })));
    const r = await sendEmail(mail());
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/502/);
  });
});

describe("templates", () => {
  it("escapes anything that came from a person", () => {
    expect(esc(`<script>alert("x")</script> & 'y'`)).toBe("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;y&#39;");
    const evil = `<img src=x onerror=alert(1)> "quoted"`;
    for (const m of [
      articleSubmittedEmail({ title: evil, authorName: evil, link: absolute("/admin/articles/1") }),
      changesRequestedEmail({ title: evil, note: evil, link: absolute("/freelancer/articles/1") }),
      articlePublishedEmail({ title: evil, link: absolute("/articles/x") }),
    ]) {
      expect(m.html).not.toContain("<img");
      expect(m.html).not.toContain("onerror=alert(1)>");
      expect(m.html).toContain("&lt;img");
    }
  });

  it("gives every email a plain-text version with its link, and absolute links", () => {
    const m = confirmSubscriptionEmail({ link: absolute("/newsletter/confirm?token=abc") });
    expect(m.text).toContain("http://localhost:3000/newsletter/confirm?token=abc");
    expect(m.html).toContain('href="http://localhost:3000/newsletter/confirm?token=abc"');
    expect(m.subject).not.toMatch(/[<>]/);
  });
});

describe("sendTestEmail (admin button)", () => {
  it("sends one test email, only to the admin's own address", async () => {
    const admin = await makeUser("admin");
    loginAs(admin);
    const r = await run(() => sendTestEmail());
    expect(r.redirectTo).toBe("/admin/emails?test=logged");
    const rows = await db.emailLog.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ to: admin.email, kind: "test" });
  });

  it.each([["a writer", "freelancer"], ["a reader", "reader"]])("refuses %s", async (_n, role) => {
    loginAs(await makeUser(role));
    expect((await run(() => sendTestEmail())).redirectTo).toBe("/staff/login");
    expect(await db.emailLog.count()).toBe(0);
  });

  it("refuses a logged-out visitor", async () => {
    loginAs(null);
    expect((await run(() => sendTestEmail())).redirectTo).toBe("/staff/login");
    expect(await db.emailLog.count()).toBe(0);
  });

  it("is rate-limited", async () => {
    loginAs(await makeUser("admin"));
    const seen = [];
    for (let i = 0; i < 7; i++) seen.push((await run(() => sendTestEmail())).redirectTo);
    expect(seen.slice(0, 5).every((u) => u === "/admin/emails?test=logged")).toBe(true);
    expect(seen[6]).toBe("/admin/emails?test=limit");
  });
});
