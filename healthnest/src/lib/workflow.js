// Article workflow rules. Single source of truth for who may do what.
// Mirrors CONTENT_MODEL_SPEC.md section 4. Always enforced on the server.
import { STATUS, ROLES, LIMITS } from "./constants";

const T = STATUS;

// from -> to -> roles allowed
const TRANSITIONS = {
  [T.DRAFT]: {
    [T.SUBMITTED]: [ROLES.FREELANCER, ROLES.ADMIN],
  },
  [T.SUBMITTED]: {
    [T.CHANGES_REQUESTED]: [ROLES.ADMIN],
    [T.APPROVED]: [ROLES.ADMIN],
    [T.PUBLISHED]: [ROLES.ADMIN],
  },
  [T.CHANGES_REQUESTED]: {
    [T.SUBMITTED]: [ROLES.FREELANCER, ROLES.ADMIN],
  },
  [T.APPROVED]: {
    [T.PUBLISHED]: [ROLES.ADMIN],
  },
  [T.PUBLISHED]: {
    [T.ARCHIVED]: [ROLES.ADMIN],
    [T.DRAFT]: [ROLES.ADMIN], // unpublish
  },
  [T.ARCHIVED]: {
    [T.PUBLISHED]: [ROLES.ADMIN],
  },
};

export function canTransition(user, article, to) {
  if (!user) return false;
  const allowed = TRANSITIONS[article.status]?.[to];
  if (!allowed || !allowed.includes(user.role)) return false;
  // A freelancer can only move their own articles.
  if (user.role === ROLES.FREELANCER && article.authorId !== user.id) return false;
  return true;
}

export function canEdit(user, article) {
  if (!user) return false;
  if (user.role === ROLES.ADMIN) return true;
  if (user.role === ROLES.FREELANCER) {
    return (
      article.authorId === user.id &&
      (article.status === T.DRAFT || article.status === T.CHANGES_REQUESTED)
    );
  }
  return false;
}

export function canView(user, article) {
  if (article.status === T.PUBLISHED) return true;
  if (!user) return false;
  if (user.role === ROLES.ADMIN) return true;
  return user.role === ROLES.FREELANCER && article.authorId === user.id;
}

const wordCount = (html) =>
  (html || "").replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;

// Spec 4.2. Returns a list of human-readable problems. Empty list = OK.
export function validateForSubmit(article, sources) {
  const problems = [];
  const t = (article.title || "").trim();
  if (t.length < LIMITS.title.min || t.length > LIMITS.title.max)
    problems.push(`Title must be ${LIMITS.title.min}-${LIMITS.title.max} characters.`);
  const ex = (article.excerpt || "").trim();
  if (ex.length < LIMITS.excerpt.min || ex.length > LIMITS.excerpt.max)
    problems.push(`Excerpt must be ${LIMITS.excerpt.min}-${LIMITS.excerpt.max} characters.`);
  if (wordCount(article.body) < 100) problems.push("Body is too short (add the full article).");
  if (!article.coverImageUrl) problems.push("Add a cover image.");
  if (!article.coverImageAlt?.trim()) problems.push("Add alt text for the cover image.");
  if (!article.categoryId) problems.push("Choose a category.");
  const goodSources = (sources || []).filter((s) => s.title && s.publisher && /^https:\/\//i.test(s.url));
  if (goodSources.length < 1) problems.push("Add at least one source with a valid https link.");
  if ((article.tagCount ?? 0) > LIMITS.maxTags) problems.push(`Use at most ${LIMITS.maxTags} tags.`);
  return problems;
}

// Spec 4.3. Extra checks before an admin publishes.
export function validateForPublish(article, sources) {
  const problems = validateForSubmit(article, sources);
  if (!article.slug) problems.push("Slug is required.");
  if (!article.seoTitle?.trim()) problems.push("Set an SEO title.");
  if (!article.seoDescription?.trim()) problems.push("Set an SEO description.");
  return problems;
}
