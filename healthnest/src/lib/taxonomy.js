import { db } from "./db";
import { slugify } from "./text";

// A category slug lives at the site root (/diabetes), so it must never shadow a real route.
export const RESERVED_SLUGS = new Set([
  "admin", "freelancer", "staff", "search", "tools", "conditions", "articles", "authors",
  "api", "uploads", "sitemap.xml", "robots.txt", "favicon.ico", "login", "logout", "signup", "account", "_next",
]);

// Returns an error string, or null if the slug is usable for a category.
export async function checkCategorySlug(slug, ignoreId) {
  if (!slug) return "Enter a URL slug.";
  if (slug !== slugify(slug)) return "Slug can only use lowercase letters, numbers and hyphens.";
  if (RESERVED_SLUGS.has(slug)) return `"${slug}" is reserved by the site. Choose another slug.`;
  if (await db.page.findUnique({ where: { slug }, select: { id: true } })) {
    return `"${slug}" is already used by a static page (like /about). Choose another slug.`;
  }
  const hit = await db.category.findUnique({ where: { slug }, select: { id: true } });
  if (hit && hit.id !== ignoreId) return "Another category already uses that slug.";
  return null;
}

export async function checkConditionSlug(slug, ignoreId) {
  if (!slug) return "Enter a URL slug.";
  if (slug !== slugify(slug)) return "Slug can only use lowercase letters, numbers and hyphens.";
  const hit = await db.condition.findUnique({ where: { slug }, select: { id: true } });
  if (hit && hit.id !== ignoreId) return "Another condition already uses that slug.";
  return null;
}
