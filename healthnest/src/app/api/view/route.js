import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rateLimit";

const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|curl|wget/i;

// Adds one to a published article's view count. Public, so it is defended against inflation:
// same-origin only, no obvious bots, and one count per visitor per article per 30 minutes.
export async function POST(req) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) return new Response(null, { status: 403 });
  if (BOT.test(req.headers.get("user-agent") || "")) return new Response(null, { status: 204 });

  let slug;
  try {
    slug = (await req.json())?.slug;
  } catch {
    return new Response(null, { status: 400 });
  }
  if (typeof slug !== "string" || slug.length > 120) return new Response(null, { status: 400 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`view:${ip}:${slug}`, 1, 30 * 60 * 1000)) return new Response(null, { status: 204 });
  if (!rateLimit(`viewip:${ip}`, 120, 60 * 60 * 1000)) return new Response(null, { status: 204 });

  await db.article.updateMany({ where: { slug, status: "published" }, data: { viewCount: { increment: 1 } } });
  return new Response(null, { status: 204 });
}
