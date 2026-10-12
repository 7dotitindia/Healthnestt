import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleEditor from "@/components/ArticleEditor";
import { db } from "@/lib/db";
import { requireFreelancer } from "@/lib/auth";
import { canEdit } from "@/lib/workflow";
import { STATUS_BADGE, STATUS_LABEL } from "@/lib/constants";
import { formatDate } from "@/lib/text";

export const dynamic = "force-dynamic";

export default async function FreelancerArticle({ params, searchParams }) {
  const user = await requireFreelancer();
  const { id } = await params;
  const sp = await searchParams;

  const article = await db.article.findUnique({
    where: { id },
    include: {
      sources: { orderBy: { position: "asc" } },
      tags: { include: { tag: true } },
      reviewNotes: { orderBy: { createdAt: "desc" }, include: { admin: { select: { name: true } } } },
    },
  });
  // Freelancers only ever see their own articles.
  if (!article || article.authorId !== user.id) notFound();

  // Active ones, plus whatever this article already uses even if it was deactivated since.
  const [categories, conditions] = await Promise.all([
    db.category.findMany({ where: { OR: [{ isActive: true }, { id: article.categoryId ?? "" }] }, orderBy: { position: "asc" } }),
    db.condition.findMany({ where: { OR: [{ isActive: true }, { id: article.conditionId ?? "" }] }, orderBy: { name: "asc" } }),
  ]);
  const editable = canEdit(user, article);

  return (
    <>
      <p className="meta"><Link href="/freelancer">My articles</Link> / {article.title}</p>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>{article.title}</h1>
        <span className={STATUS_BADGE[article.status]}>{STATUS_LABEL[article.status]}</span>
      </div>

      {sp?.saved && <p className="alert alert-ok" role="status">Saved.</p>}
      {sp?.submitted && <p className="alert alert-info" role="status">Submitted. The admin will review it soon.</p>}
      {!editable && <p className="alert alert-info" style={{ margin: "12px 0" }}>This article is locked while it is {STATUS_LABEL[article.status].toLowerCase()}. Only the admin can change it now.</p>}

      {article.reviewNotes.length > 0 && (
        <section style={{ margin: "16px 0" }} aria-label="Feedback">
          <h2 style={{ fontSize: 16 }}>Feedback from admin</h2>
          {article.reviewNotes.map((n) => (
            <div key={n.id} className={n.type === "changes_requested" ? "alert alert-warn" : "alert alert-info"} style={{ marginBottom: 8 }}>
              <b>{n.type === "changes_requested" ? "Changes requested" : n.type === "approved" ? "Approved" : "Note"}</b>
              <span className="meta"> by {n.admin.name} on {formatDate(n.createdAt)}</span>
              {n.message && <p style={{ margin: "4px 0 0" }}>{n.message}</p>}
            </div>
          ))}
        </section>
      )}

      <ArticleEditor article={article} categories={categories} conditions={conditions} isAdmin={false} readOnly={!editable} />
    </>
  );
}
