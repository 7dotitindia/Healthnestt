import "server-only";
import { db } from "./db";
import { sendEmail } from "./email";
import {
  absolute, articleSubmittedEmail, changesRequestedEmail, articleApprovedEmail, articlePublishedEmail,
} from "./emailTemplates";

// Workflow notifications. Every function swallows its own errors: a problem with email must never stop
// a writer submitting or an editor publishing.
async function safely(fn) {
  try {
    await fn();
  } catch {
    /* intentionally ignored: the failure is already recorded in the email log where it matters */
  }
}

// A writer submitted an article: tell every active admin.
export function notifyAdminsSubmitted(article, authorName) {
  return safely(async () => {
    const admins = await db.user.findMany({ where: { role: "admin", status: "active" }, select: { email: true } });
    const mail = articleSubmittedEmail({ title: article.title, authorName, link: absolute(`/admin/articles/${article.id}`) });
    await Promise.all(admins.map((a) => sendEmail({ to: a.email, kind: "article_submitted", ...mail })));
  });
}

// An admin acted on an article: tell its author, unless the admin wrote it themselves.
export function notifyAuthor(kind, article, { actorId, note } = {}) {
  return safely(async () => {
    if (article.authorId === actorId) return;
    const author = await db.user.findUnique({ where: { id: article.authorId }, select: { email: true, status: true } });
    if (!author || author.status !== "active") return;
    const dashboardLink = absolute(`/freelancer/articles/${article.id}`);
    const mail =
      kind === "changes_requested" ? changesRequestedEmail({ title: article.title, note: note || "", link: dashboardLink })
      : kind === "article_approved" ? articleApprovedEmail({ title: article.title, link: dashboardLink })
      : kind === "article_published" ? articlePublishedEmail({ title: article.title, link: absolute(`/articles/${article.slug}`) })
      : null;
    if (mail) await sendEmail({ to: author.email, kind, ...mail });
  });
}
