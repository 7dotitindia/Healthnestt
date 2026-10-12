import "server-only";
import { db } from "./db";

// Email sending, in one place.
//   EMAIL_PROVIDER=log     (default) nothing leaves the machine. Every email is saved to the EmailLog table and shown at /admin/emails.
//   EMAIL_PROVIDER=resend  sends through Resend's HTTP API. Needs RESEND_API_KEY and an EMAIL_FROM address on a domain verified at Resend.
// A failed send never throws into the caller: signing up, submitting or publishing must work even if email is down.

const EMAIL_RE = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]+$/;

// Collapses line breaks, which could otherwise be used to inject extra email headers.
export const oneLine = (s) => String(s ?? "").replace(/[\r\n\u2028\u2029]+/g, " ").replace(/\s+/g, " ").trim();

export function emailConfig() {
  const wantsResend = process.env.EMAIL_PROVIDER === "resend";
  const hasKey = !!process.env.RESEND_API_KEY;
  return {
    provider: wantsResend && hasKey ? "resend" : "log",
    requested: process.env.EMAIL_PROVIDER || "log",
    misconfigured: wantsResend && !hasKey, // asked for Resend but no key: falls back to the log and says so
    from: process.env.EMAIL_FROM || "Healthnestt <no-reply@healthnestt.local>",
  };
}

async function saveLog(data) {
  try {
    return await db.emailLog.create({ data });
  } catch {
    return null; // logging must never break the caller
  }
}

export async function sendEmail({ to, subject, html, text, kind }) {
  const address = oneLine(to).toLowerCase();
  const subj = oneLine(subject).slice(0, 200);
  const { provider, from } = emailConfig();
  const base = { to: address, subject: subj, html, text, kind, provider };

  if (!EMAIL_RE.test(address)) {
    await saveLog({ ...base, status: "failed", error: "Invalid recipient address." });
    return { ok: false, status: "failed", error: "Invalid recipient address." };
  }

  if (provider === "log") {
    const row = await saveLog({ ...base, status: "logged" });
    return { ok: true, status: "logged", id: row?.id };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [address], subject: subj, html, text }),
      signal: controller.signal,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = String(body?.message || `Provider returned HTTP ${res.status}`).slice(0, 300);
      const row = await saveLog({ ...base, status: "failed", error });
      return { ok: false, status: "failed", error, id: row?.id };
    }
    const row = await saveLog({ ...base, status: "sent", providerId: body?.id ? String(body.id) : null });
    return { ok: true, status: "sent", id: row?.id };
  } catch (e) {
    const error = e?.name === "AbortError" ? "The email provider did not answer in time." : "Could not reach the email provider.";
    const row = await saveLog({ ...base, status: "failed", error });
    return { ok: false, status: "failed", error, id: row?.id };
  } finally {
    clearTimeout(timer);
  }
}

// How many emails of a kind went to an address recently. Used to stop the signup form being used to flood someone's inbox.
export async function recentEmailCount(to, kind, withinMs) {
  return db.emailLog.count({
    where: { to: oneLine(to).toLowerCase(), kind, createdAt: { gte: new Date(Date.now() - withinMs) } },
  });
}
