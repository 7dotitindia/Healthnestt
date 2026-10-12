"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/session";
import { rateLimit } from "@/lib/rateLimit";
import { ROLES, USER_STATUS } from "@/lib/constants";

const schema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(200),
});

// Hash compared when the email is unknown, so response time does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);
const GENERIC_ERROR = "Email or password is incorrect.";

export async function login(_prev, formData) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const parsed = schema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: GENERIC_ERROR };
  const { email, password } = parsed.data;

  if (!rateLimit(`login:${ip}`, 20, 15 * 60 * 1000) || !rateLimit(`login:${email}`, 8, 15 * 60 * 1000)) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  const user = await db.user.findUnique({ where: { email } });
  const ok = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);
  const staff = user && (user.role === ROLES.ADMIN || user.role === ROLES.FREELANCER);
  if (!user || !ok || !staff || user.status !== USER_STATUS.ACTIVE) return { error: GENERIC_ERROR };

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession(user.id);
  redirect(user.role === ROLES.ADMIN ? "/admin" : "/freelancer");
}

export async function logout() {
  await destroySession();
  redirect("/staff/login");
}
