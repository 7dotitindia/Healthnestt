"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { cleanBody } from "@/lib/sanitize";
import { parseYouTubeId } from "@/lib/video";
import { slugify, readingTime, addMonths } from "@/lib/text";
import { canEdit, canTransition, validateForSubmit, validateForPublish } from "@/lib/workflow";
import { notifyAdminsSubmitted, notifyAuthor } from "@/lib/notify";
import { LIMITS, REVIEW_MONTHS, ROLES, STATUS } from "@/lib/constants";

const sourceSchema = z.object({
  title: z.string().trim().min(1).max(200),
  publisher: z.string().trim().min(1).max(120),
  url: z.string().trim().max(500),
  publishedYear: z.coerce.number().int().min(1900).max(2100).nullable().optional(),
});

const text = (formData, key, max) => String(formData.get(key) ?? "").trim().slice(0, max);

function parseSources(raw) {
  try {
    const list = JSON.parse(raw || "[]");
    if (!Array.isArray(list)) return [];
    return list
      .map((s) => ({ ...s, publishedYear: s.publishedYear === "" || s.publishedYear == null ? null : s.publishedYear }))
      .map((s) => sourceSchema.safeParse(s))
      .filter((r) => r.success)
      .map((r) => r.data)
      .slice(0, 20);
  } catch {
    return [];
  }
}

async function uniqueSlug(base, ignoreId) {
  const root = slugify(base) || "article";
  let slug = root;
  for (let i = 2; ; i++) {
    const hit = await db.article.findUnique({ where: { slug }, select: { id: true } });
    if (!hit || hit.id === ignoreId) return slug;
    slug = `${root.slice(0, LIMITS.slug - 4)}-${i}`;
  }
}

// Create or update an article. intent = "save" keeps it a draft, "submit" sends it to admin.
export async function saveArticle(_prev, formData) {
  const user = await getCurrentUser();
  if (!user || (user.role !== ROLES.ADMIN && user.role !== ROLES.FREELANCER)) redirect("/staff/login");

  const id = text(formData, "id", 40) || null;
  const intent = formData.get("intent") === "submit" ? "submit" : "save";

  let existing = null;
  if (id) {
    existing = await db.article.findUnique({ where: { id }, include: { tags: true } });
    if (!existing || !canEdit(user, existing)) return { errors: ["You can't edit this article."] };
  }

  const title = text(formData, "title", LIMITS.title.max);
  if (title.length < 3) return { errors: ["Enter a title."] };

  const isAdmin = user.role === ROLES.ADMIN;
  const sources = parseSources(formData.get("sources"));
  const tagNames = [...new Set(text(formData, "tags", 300).split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))].slice(0, 20);
  const body = cleanBody(String(formData.get("body") ?? ""));
  const categoryId = text(formData, "categoryId", 40) || null;
  const conditionId = text(formData, "conditionId", 40) || null;
  const coverImageUrl = text(formData, "coverImageUrl", 500) || null;
  if (coverImageUrl) {
    // Covers must be files uploaded through the site (tracked in MediaAsset).
    const asset = await db.mediaAsset.findUnique({ where: { url: coverImageUrl }, select: { id: true } });
    if (!asset) return { errors: ["Upload the cover image again. The selected image was not found."] };
  }

  // Only a plain YouTube id is stored; the embed address is rebuilt from it when the page is shown.
  const videoUrl = text(formData, "videoUrl", 300);
  const videoId = videoUrl ? parseYouTubeId(videoUrl) : null;
  if (videoUrl && !videoId) return { errors: ["The video link must be a YouTube address, for example https://youtu.be/dQw4w9WgXcQ. Leave it empty for no video."] };

  const data = {
    title,
    excerpt: text(formData, "excerpt", LIMITS.excerpt.max),
    body,
    coverImageUrl,
    coverImageAlt: text(formData, "coverImageAlt", LIMITS.coverAlt) || null,
    videoId,
    categoryId,
    conditionId,
    readingTimeMin: readingTime(body),
  };

  if (isAdmin) {
    data.seoTitle = text(formData, "seoTitle", LIMITS.seoTitle) || null;
    data.seoDescription = text(formData, "seoDescription", LIMITS.seoDescription) || null;
    data.isFeatured = formData.get("isFeatured") === "on";
    // Slug stays locked once an article has been published.
    if (!existing?.publishedAt) {
      const wanted = text(formData, "slug", LIMITS.slug);
      data.slug = await uniqueSlug(wanted || title, existing?.id);
    }
  } else if (!existing) {
    data.slug = await uniqueSlug(title);
  }

  if (intent === "submit") {
    const problems = validateForSubmit({ ...data, tagCount: tagNames.length }, sources);
    if (problems.length) return { errors: problems };
    const probe = existing || { status: STATUS.DRAFT, authorId: user.id };
    if (!canTransition(user, probe, STATUS.SUBMITTED)) return { errors: ["This article can't be submitted right now."] };
    data.status = STATUS.SUBMITTED;
    data.submittedAt = new Date();
  }

  const tagRecords = [];
  for (const name of tagNames) {
    tagRecords.push(await db.tag.upsert({ where: { slug: slugify(name) || name }, update: {}, create: { name, slug: slugify(name) || name } }));
  }

  const saved = await db.$transaction(async (tx) => {
    const article = existing
      ? await tx.article.update({ where: { id: existing.id }, data })
      : await tx.article.create({ data: { ...data, authorId: user.id } });
    await tx.source.deleteMany({ where: { articleId: article.id } });
    if (sources.length) {
      await tx.source.createMany({ data: sources.map((s, position) => ({ ...s, articleId: article.id, position })) });
    }
    await tx.articleTag.deleteMany({ where: { articleId: article.id } });
    if (tagRecords.length) {
      await tx.articleTag.createMany({ data: tagRecords.map((t) => ({ articleId: article.id, tagId: t.id })) });
    }
    return article;
  });

  // Tell the admins a writer has submitted. Failures here are swallowed inside notify.js.
  if (intent === "submit" && user.role === ROLES.FREELANCER) await notifyAdminsSubmitted(saved, user.name);

  redirect(`${isAdmin ? "/admin" : "/freelancer"}/articles/${saved.id}?${intent === "submit" ? "submitted=1" : "saved=1"}`);
}

// Admin-only workflow steps. The role and the transition table are checked on the server.
export async function reviewAction(_prev, formData) {
  const user = await getCurrentUser();
  if (!user || user.role !== ROLES.ADMIN) redirect("/staff/login");

  const id = text(formData, "id", 40);
  const action = text(formData, "action", 30);
  const message = text(formData, "message", 2000);

  const article = await db.article.findUnique({ where: { id }, include: { sources: true, tags: true } });
  if (!article) return { errors: ["Article not found."] };

  const targets = {
    request_changes: STATUS.CHANGES_REQUESTED,
    approve: STATUS.APPROVED,
    publish: STATUS.PUBLISHED,
    unpublish: STATUS.DRAFT,
    archive: STATUS.ARCHIVED,
  };
  const to = targets[action];
  if (!to) return { errors: ["Unknown action."] };
  if (!canTransition(user, article, to)) return { errors: [`You can't move this article from "${article.status}" to "${to}".`] };

  const update = { status: to };
  let noteType = "comment";

  if (action === "request_changes") {
    if (!message) return { errors: ["Write a note so the freelancer knows what to change."] };
    noteType = "changes_requested";
  }
  if (action === "approve") noteType = "approved";
  if (action === "publish") {
    if (formData.get("checklist") !== "on") return { errors: ["Tick the publish checklist first."] };
    const problems = validateForPublish({ ...article, tagCount: article.tags.length }, article.sources);
    if (problems.length) return { errors: problems };
    const now = new Date();
    update.publishedAt = article.publishedAt ?? now;
    update.lastReviewedAt = now;
    update.nextReviewDueAt = addMonths(now, REVIEW_MONTHS);
  }

  await db.$transaction([
    db.article.update({ where: { id }, data: update }),
    db.reviewNote.create({ data: { articleId: id, adminId: user.id, type: noteType, message } }),
  ]);

  // Tell the author what happened (never the admin themselves, and only on a first publish).
  if (action === "request_changes") await notifyAuthor("changes_requested", article, { actorId: user.id, note: message });
  if (action === "approve") await notifyAuthor("article_approved", article, { actorId: user.id });
  if (action === "publish" && !article.publishedAt) await notifyAuthor("article_published", article, { actorId: user.id });

  redirect(`/admin/articles/${id}?done=${action}`);
}
