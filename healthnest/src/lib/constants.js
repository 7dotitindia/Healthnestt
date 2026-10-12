export const SITE_NAME = "Healthnestt";
export const SITE_TAGLINE = "Clear, sourced health information for India";
export const SITE_URL = process.env.SITE_URL || "http://localhost:3000";

export const ROLES = { ADMIN: "admin", FREELANCER: "freelancer", READER: "reader" };
export const USER_STATUS = { ACTIVE: "active", DEACTIVATED: "deactivated" };

export const STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  CHANGES_REQUESTED: "changes_requested",
  APPROVED: "approved",
  PUBLISHED: "published",
  ARCHIVED: "archived",
};

export const STATUS_LABEL = {
  draft: "Draft",
  submitted: "Submitted",
  changes_requested: "Changes requested",
  approved: "Approved",
  published: "Published",
  archived: "Archived",
};

// Badge style per status (see design system section 7)
export const STATUS_BADGE = {
  draft: "badge",
  submitted: "badge badge-info",
  changes_requested: "badge badge-bad",
  approved: "badge badge-ok",
  published: "badge badge-topic",
  archived: "badge",
};

export const LIMITS = {
  title: { min: 20, max: 110 },
  excerpt: { min: 50, max: 160 },
  seoTitle: 60,
  seoDescription: 155,
  coverAlt: 125,
  maxTags: 5,
  slug: 80,
};

export const DISCLAIMER =
  "This content is for information only and is not a substitute for professional medical advice, diagnosis or treatment.";

export const REVIEW_MONTHS = 12;

// A newsletter confirmation link works for 7 days.
export const CONFIRM_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
