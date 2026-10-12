import { db } from "./db";
import { STATUS } from "./constants";

const published = { status: STATUS.PUBLISHED };

const cardSelect = {
  id: true, title: true, slug: true, excerpt: true, coverImageUrl: true, coverImageAlt: true, videoId: true,
  readingTimeMin: true, publishedAt: true, lastReviewedAt: true,
  author: { select: { name: true, slug: true } },
  category: { select: { name: true, slug: true } },
};

export const getCategories = () =>
  db.category.findMany({ where: { isActive: true }, orderBy: { position: "asc" } });

export const getCategoryBySlug = (slug) => db.category.findFirst({ where: { slug, isActive: true } });

// Categories with how many published articles each has.
export const getCategoriesWithCounts = () =>
  db.category.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
    include: { _count: { select: { articles: { where: published } } } },
  });

// Conditions with their category and published article count.
export const getConditionsWithCounts = () =>
  db.condition.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: { category: true, _count: { select: { articles: { where: published } } } },
  });

export const getLatestArticles = (take = 9, skip = 0, where = {}) =>
  db.article.findMany({
    where: { ...published, ...where },
    orderBy: { publishedAt: "desc" },
    take,
    skip,
    select: cardSelect,
  });

export const countArticles = (where = {}) => db.article.count({ where: { ...published, ...where } });

export const getFeaturedArticles = (take = 3) =>
  db.article.findMany({
    where: { ...published, isFeatured: true },
    orderBy: [{ featuredRank: "asc" }, { publishedAt: "desc" }],
    take,
    select: cardSelect,
  });

export const getTrendingArticles = (take = 4) =>
  db.article.findMany({
    where: published,
    orderBy: [{ viewCount: "desc" }, { publishedAt: "desc" }],
    take,
    select: cardSelect,
  });

export const getArticleBySlug = (slug) =>
  db.article.findFirst({
    where: { slug, ...published },
    include: {
      author: { select: { name: true, slug: true, bio: true } },
      category: true,
      condition: true,
      sources: { orderBy: { position: "asc" } },
      tags: { include: { tag: true } },
    },
  });

export const getRelatedArticles = (article, take = 3) =>
  db.article.findMany({
    where: { ...published, id: { not: article.id }, categoryId: article.categoryId },
    orderBy: { publishedAt: "desc" },
    take,
    select: cardSelect,
  });

export const getConditions = () =>
  db.condition.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, include: { category: true } });

export const getConditionBySlug = (slug) =>
  db.condition.findFirst({ where: { slug, isActive: true }, include: { category: true } });

export const getAuthorBySlug = (slug) =>
  db.user.findFirst({
    where: { slug, status: "active", role: { in: ["admin", "freelancer"] } },
    select: { id: true, name: true, slug: true, bio: true },
  });

export const getPage = (slug) => db.page.findUnique({ where: { slug } });

// Static pages in a sensible reading order, for the side navigation on About, Privacy and so on.
const PAGE_ORDER = ["about", "editorial-policy", "advertising-policy", "privacy", "terms", "disclaimer", "contact"];
export async function getPages() {
  const pages = await db.page.findMany({ select: { slug: true, title: true } });
  const rank = (s) => (PAGE_ORDER.includes(s) ? PAGE_ORDER.indexOf(s) : PAGE_ORDER.length);
  return pages.sort((a, b) => rank(a.slug) - rank(b.slug) || a.title.localeCompare(b.title));
}

export const getCalculators = () => db.calculator.findMany({ where: { isActive: true } });

export async function searchArticles(q, take = 20, categorySlug = null) {
  // % and _ are wildcards in the database's text match, so they are removed rather than passed through.
  const term = (q || "").replace(/[%_]/g, " ").trim();
  if (term.length < 2) return [];
  return db.article.findMany({
    where: {
      ...published,
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
      OR: [
        { title: { contains: term } },
        { excerpt: { contains: term } },
        { body: { contains: term } },
        { category: { name: { contains: term } } },
      ],
    },
    orderBy: { publishedAt: "desc" },
    take,
    select: cardSelect,
  });
}

// A reader's saved articles, newest first. Unpublished articles drop out of the list automatically.
export const getBookmarkedArticles = (userId) =>
  db.bookmark
    .findMany({
      where: { userId, article: { ...published } },
      orderBy: { createdAt: "desc" },
      select: { article: { select: cardSelect } },
    })
    .then((rows) => rows.map((r) => r.article));

export const isArticleBookmarked = async (userId, articleId) =>
  !!(await db.bookmark.findUnique({ where: { userId_articleId: { userId, articleId } }, select: { id: true } }));

// Published articles that have a video, newest first. Powers the /videos page.
const withVideo = { ...published, videoId: { not: null } };
export const getVideoArticles = (take = 24, skip = 0) =>
  db.article.findMany({ where: withVideo, orderBy: { publishedAt: "desc" }, take, skip, select: cardSelect });
export const countVideoArticles = () => db.article.count({ where: withVideo });
