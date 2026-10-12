import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function sitemap() {
  const [articles, categories, conditions, tools, pages] = await Promise.all([
    db.article.findMany({ where: { status: "published" }, select: { slug: true, lastReviewedAt: true, publishedAt: true } }),
    db.category.findMany({ where: { isActive: true }, select: { slug: true } }),
    db.condition.findMany({ where: { isActive: true }, select: { slug: true } }),
    db.calculator.findMany({ where: { isActive: true }, select: { slug: true } }),
    db.page.findMany({ select: { slug: true, updatedAt: true } }),
  ]);
  const u = (p) => `${SITE_URL}${p}`;
  return [
    { url: u("/"), changeFrequency: "daily", priority: 1 },
    { url: u("/conditions"), changeFrequency: "weekly" },
    { url: u("/tools"), changeFrequency: "monthly" },
    { url: u("/videos"), changeFrequency: "weekly" },
    ...categories.map((c) => ({ url: u(`/${c.slug}`), changeFrequency: "daily", priority: 0.8 })),
    ...conditions.map((c) => ({ url: u(`/conditions/${c.slug}`), changeFrequency: "weekly", priority: 0.7 })),
    ...tools.map((t) => ({ url: u(`/tools/${t.slug}`), changeFrequency: "monthly", priority: 0.6 })),
    ...articles.map((a) => ({ url: u(`/articles/${a.slug}`), lastModified: a.lastReviewedAt || a.publishedAt, priority: 0.9 })),
    ...pages.map((p) => ({ url: u(`/${p.slug}`), lastModified: p.updatedAt, priority: 0.3 })),
  ];
}
