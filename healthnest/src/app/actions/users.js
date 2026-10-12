"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/text";
import { ROLES, USER_STATUS } from "@/lib/constants";
import { redirect } from "next/navigation";

const createSchema = z.object({
  name: z.string().trim().min(2, "Enter a name.").max(80),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email.")),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters.")
    .regex(/[a-zA-Z]/, "Password needs a letter.")
    .regex(/[0-9]/, "Password needs a number."),
});

async function adminOnly() {
  const user = await getCurrentUser();
  if (!user || user.role !== ROLES.ADMIN) redirect("/staff/login");
  return user;
}

export async function createFreelancer(_prev, formData) {
  await adminOnly();
  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const { name, email, password } = parsed.data;
  if (await db.user.findUnique({ where: { email } })) return { ok: false, message: "That email is already registered." };

  let slug = slugify(name) || "writer";
  for (let i = 2; await db.user.findUnique({ where: { slug } }); i++) slug = `${slugify(name) || "writer"}-${i}`;

  await db.user.create({
    data: { name, email, slug, role: ROLES.FREELANCER, passwordHash: await bcrypt.hash(password, 12) },
  });
  revalidatePath("/admin/users");
  return { ok: true, message: `Created ${name}. Share the password with them securely.` };
}

export async function setUserStatus(formData) {
  const admin = await adminOnly();
  const id = String(formData.get("id") || "");
  const status = formData.get("status") === USER_STATUS.ACTIVE ? USER_STATUS.ACTIVE : USER_STATUS.DEACTIVATED;
  if (id === admin.id) return; // admins cannot lock themselves out
  const target = await db.user.findUnique({ where: { id } });
  if (!target || target.role !== ROLES.FREELANCER) return;
  await db.user.update({ where: { id }, data: { status } });
  revalidatePath("/admin/users");
}
