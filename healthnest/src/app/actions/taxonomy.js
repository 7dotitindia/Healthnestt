"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/text";
import { checkCategorySlug, checkConditionSlug } from "@/lib/taxonomy";
import { ROLES } from "@/lib/constants";

async function adminOnly() {
  const user = await getCurrentUser();
  if (!user || user.role !== ROLES.ADMIN) redirect("/staff/login");
  return user;
}

const field = (formData, key, max) => String(formData.get(key) ?? "").trim().slice(0, max);
const fail = (...errors) => ({ errors });

const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(60, "Name is too long."),
  description: z.string().min(20, "Description must be at least 20 characters.").max(300, "Description can be at most 300 characters."),
  position: z.coerce.number().int("Position must be a whole number.").min(0).max(999),
});

const conditionSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(80, "Name is too long."),
  overview: z.string().min(20, "Overview must be at least 20 characters.").max(1500, "Overview can be at most 1500 characters."),
  categoryId: z.string().min(1, "Choose a category."),
});

export async function saveCategory(_prev, formData) {
  await adminOnly();
  const id = field(formData, "id", 40) || null;

  const parsed = categorySchema.safeParse({
    name: field(formData, "name", 60),
    description: field(formData, "description", 300),
    position: field(formData, "position", 4) || "0",
  });
  if (!parsed.success) return fail(...parsed.error.issues.map((i) => i.message));
  const { name, description, position } = parsed.data;

  let existing = null;
  if (id) {
    existing = await db.category.findUnique({ where: { id }, include: { _count: { select: { articles: true } } } });
    if (!existing) return fail("Category not found.");
  }

  // Once a category has articles its URL is live, so the slug is locked.
  const locked = existing && existing._count.articles > 0;
  const slug = locked ? existing.slug : slugify(field(formData, "slug", 80) || name);
  const slugError = locked ? null : await checkCategorySlug(slug, id);
  if (slugError) return fail(slugError);

  if (await db.category.findFirst({ where: { name, NOT: id ? { id } : undefined }, select: { id: true } })) {
    return fail("Another category already uses that name.");
  }

  const isActive = formData.get("isActive") === "on";
  const data = { name, slug, description, position, isActive };
  if (existing) await db.category.update({ where: { id }, data });
  else await db.category.create({ data });

  redirect(`/admin/categories?${existing ? "saved" : "created"}=${encodeURIComponent(name)}`);
}

export async function deleteCategory(formData) {
  await adminOnly();
  const id = field(formData, "id", 40);
  const cat = await db.category.findUnique({
    where: { id },
    include: { _count: { select: { articles: true, conditions: true } } },
  });
  if (!cat) redirect("/admin/categories");
  // Categories in use are deactivated, never deleted.
  if (cat._count.articles > 0 || cat._count.conditions > 0) redirect("/admin/categories?blocked=1");
  await db.category.delete({ where: { id } });
  redirect(`/admin/categories?deleted=${encodeURIComponent(cat.name)}`);
}

export async function saveCondition(_prev, formData) {
  await adminOnly();
  const id = field(formData, "id", 40) || null;

  const parsed = conditionSchema.safeParse({
    name: field(formData, "name", 80),
    overview: field(formData, "overview", 1500),
    categoryId: field(formData, "categoryId", 40),
  });
  if (!parsed.success) return fail(...parsed.error.issues.map((i) => i.message));
  const { name, overview, categoryId } = parsed.data;

  if (!(await db.category.findUnique({ where: { id: categoryId }, select: { id: true } }))) return fail("Choose a valid category.");

  let existing = null;
  if (id) {
    existing = await db.condition.findUnique({ where: { id }, include: { _count: { select: { articles: true } } } });
    if (!existing) return fail("Condition not found.");
  }

  const locked = existing && existing._count.articles > 0;
  const slug = locked ? existing.slug : slugify(field(formData, "slug", 80) || name);
  const slugError = locked ? null : await checkConditionSlug(slug, id);
  if (slugError) return fail(slugError);

  if (await db.condition.findFirst({ where: { name, NOT: id ? { id } : undefined }, select: { id: true } })) {
    return fail("Another condition already uses that name.");
  }

  const data = { name, slug, overview, categoryId, isActive: formData.get("isActive") === "on" };
  if (existing) await db.condition.update({ where: { id }, data });
  else await db.condition.create({ data });

  redirect(`/admin/conditions?${existing ? "saved" : "created"}=${encodeURIComponent(name)}`);
}

export async function deleteCondition(formData) {
  await adminOnly();
  const id = field(formData, "id", 40);
  const c = await db.condition.findUnique({ where: { id }, include: { _count: { select: { articles: true } } } });
  if (!c) redirect("/admin/conditions");
  if (c._count.articles > 0) redirect("/admin/conditions?blocked=1");
  await db.condition.delete({ where: { id } });
  redirect(`/admin/conditions?deleted=${encodeURIComponent(c.name)}`);
}
