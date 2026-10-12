"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createSession, destroySession } from "@/lib/session";
import { rateLimit } from "@/lib/rateLimit";
import { safeNext } from "@/lib/safeNext";
import { slugify } from "@/lib/text";
import { ROLES, STATUS, USER_STATUS } from "@/lib/constants";

const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address."));

const signupSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80, "That name is too long."),
  email,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(200, "That password is too long.")
    .regex(/[a-zA-Z]/, "Password needs a letter.")
    .regex(/[0-9]/, "Password needs a number."),
});

const loginSchema = z.object({ email, password: z.string().min(1).max(200) });

// Compared against when the email is unknown, so response time does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);
const GENERIC_LOGIN_ERROR = "Email or password is incorrect.";
const dashboardFor = (role) => (role === ROLES.ADMIN ? "/admin" : role === ROLES.FREELANCER ? "/freelancer" : null);

const clientIp = async () => (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";

export async function signup(_prev, formData) {
  const ip = await clientIp();
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!rateLimit(`signup:${ip}`, 5, 60 * 60 * 1000)) {
    return { error: "Too many sign-ups from this connection. Please try again later." };
  }

  const { name, email: addr, password } = parsed.data;
  // Same answer whether or not the address is taken would need email verification; until that exists
  // the message stays neutral and points the person at sign in.
  if (await db.user.findUnique({ where: { email: addr }, select: { id: true } })) {
    return { error: "We couldn't create that account. If you already have one, sign in instead." };
  }

  const base = slugify(name) || "reader";
  let slug = base;
  for (let i = 2; await db.user.findUnique({ where: { slug }, select: { id: true } }); i++) slug = `${base}-${i}`;

  const user = await db.user.create({
    data: { name, email: addr, slug, role: ROLES.READER, passwordHash: await bcrypt.hash(password, 12), lastLoginAt: new Date() },
  });
  await createSession(user.id);
  redirect(safeNext(formData.get("next")));
}

export async function loginReader(_prev, formData) {
  const ip = await clientIp();
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: GENERIC_LOGIN_ERROR };
  const { email: addr, password } = parsed.data;

  if (!rateLimit(`login:${ip}`, 20, 15 * 60 * 1000) || !rateLimit(`login:${addr}`, 8, 15 * 60 * 1000)) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  const user = await db.user.findUnique({ where: { email: addr } });
  const ok = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);
  if (!user || !ok || user.status !== USER_STATUS.ACTIVE) return { error: GENERIC_LOGIN_ERROR };

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession(user.id);
  // Staff always land on their dashboard; readers go where they were headed.
  redirect(dashboardFor(user.role) || safeNext(formData.get("next")));
}

export async function logoutReader() {
  await destroySession();
  redirect("/");
}

export async function updateProfile(_prev, formData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  const parsed = z.string().trim().min(2, "Enter your name.").max(80, "That name is too long.").safeParse(formData.get("name"));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  await db.user.update({ where: { id: user.id }, data: { name: parsed.data } });
  revalidatePath("/account");
  return { ok: true, message: "Saved." };
}

// Saves or removes a bookmark. Only published articles can be saved, and only by a signed-in person.
export async function toggleBookmark(articleId) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, needsLogin: true };
  if (typeof articleId !== "string" || articleId.length > 40) return { ok: false };
  if (!rateLimit(`bookmark:${user.id}`, 120, 10 * 60 * 1000)) return { ok: false, message: "Slow down a little." };

  const existing = await db.bookmark.findUnique({ where: { userId_articleId: { userId: user.id, articleId } } });
  if (existing) {
    await db.bookmark.delete({ where: { id: existing.id } });
    revalidatePath("/account");
    return { ok: true, saved: false };
  }
  const article = await db.article.findFirst({ where: { id: articleId, status: STATUS.PUBLISHED }, select: { id: true } });
  if (!article) return { ok: false, message: "That article isn't available." };
  await db.bookmark.create({ data: { userId: user.id, articleId } });
  revalidatePath("/account");
  return { ok: true, saved: true };
}
