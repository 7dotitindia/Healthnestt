"use server";

import * as z from "zod";
import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rateLimit";
import { sendEmail, recentEmailCount } from "@/lib/email";
import { absolute, confirmSubscriptionEmail } from "@/lib/emailTemplates";
import { isConfirmationExpired } from "@/lib/newsletterState";

const schema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Please enter a valid email address.")),
  consent: z.literal("on", { error: "Please tick the box to agree." }),
});

const RESEND_COOLDOWN_MS = 10 * 60 * 1000; // no second email within 10 minutes
const HOURLY_CAP = 3; // at most 3 confirmation emails per address per hour, however many people ask
const TOKEN_RE = /^[A-Za-z0-9_-]{20,128}$/;

const newToken = () => randomBytes(32).toString("hex");

async function sendConfirmation(sub) {
  // Anyone can type any address into the form, so cap how many emails one inbox can be sent.
  if ((await recentEmailCount(sub.email, "newsletter_confirm", 60 * 60 * 1000)) >= HOURLY_CAP) return;
  await sendEmail({
    to: sub.email,
    kind: "newsletter_confirm",
    ...confirmSubscriptionEmail({ link: absolute(`/newsletter/confirm?token=${sub.token}`) }),
  });
}

export async function subscribe(_prev, formData) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`newsletter:${ip}`, 5, 10 * 60 * 1000)) {
    return { ok: false, message: "Too many attempts. Please try again in a few minutes." };
  }

  const parsed = schema.safeParse({ email: formData.get("email"), consent: formData.get("consent") });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const { email } = parsed.data;
  const source = String(formData.get("source") || "site").slice(0, 40);
  const existing = await db.newsletterSubscriber.findUnique({ where: { email } });

  // The reply is identical in every case below, so the form cannot be used to find out who is on the list.
  if (!existing) {
    const sub = await db.newsletterSubscriber.create({ data: { email, source, token: newToken() } });
    await sendConfirmation(sub);
  } else if (existing.status === "pending" && Date.now() - existing.consentAt.getTime() < RESEND_COOLDOWN_MS) {
    // A confirmation email went out moments ago. Do nothing.
  } else if (existing.status !== "confirmed") {
    const sub = await db.newsletterSubscriber.update({
      where: { email },
      data: { status: "pending", token: newToken(), consentAt: new Date(), unsubscribedAt: null },
    });
    await sendConfirmation(sub);
  }
  return { ok: true, message: "Thanks for subscribing. We'll email you a link to confirm." };
}

const tokenFrom = (formData) => {
  const t = String(formData.get("token") || "");
  return TOKEN_RE.test(t) ? t : null;
};

// Called by the "Confirm" button on /newsletter/confirm. A button (not just opening the link) means
// email security scanners that pre-open links cannot confirm a subscription by accident.
export async function confirmSubscription(formData) {
  const token = tokenFrom(formData);
  const sub = token ? await db.newsletterSubscriber.findUnique({ where: { token } }) : null;
  if (!sub) redirect("/newsletter/confirm?state=invalid");
  if (sub.status === "pending") {
    if (isConfirmationExpired(sub.consentAt)) redirect("/newsletter/confirm?state=expired");
    await db.newsletterSubscriber.update({ where: { id: sub.id }, data: { status: "confirmed", confirmedAt: new Date() } });
  } else if (sub.status === "unsubscribed") {
    redirect("/newsletter/confirm?state=invalid");
  }
  redirect("/newsletter/confirm?state=done");
}

export async function unsubscribe(formData) {
  const token = tokenFrom(formData);
  const sub = token ? await db.newsletterSubscriber.findUnique({ where: { token } }) : null;
  if (!sub) redirect("/newsletter/unsubscribe?state=invalid");
  if (sub.status !== "unsubscribed") {
    await db.newsletterSubscriber.update({ where: { id: sub.id }, data: { status: "unsubscribed", unsubscribedAt: new Date() } });
  }
  redirect("/newsletter/unsubscribe?state=done");
}
