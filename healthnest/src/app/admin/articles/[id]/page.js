import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleEditor from "@/components/ArticleEditor";
import ReviewPanel from "@/components/ReviewPanel";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { STATUS_BADGE, STATUS_LABEL } from "@/lib/constants";
import { formatDate } from "@/lib/text";

export const dynamic = "force-dynamic";

const DONE = {
  request_changes: "Changes requested. The freelancer can now edit.",
  approve: "Approved.",
  publish: "Published. It is live on the site.",
  unpublish: "Unpublished. It is back to draft.",
  archive: "Archived.",
};

export default async function AdminArticle({ params, searchParams }) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;

  const article = await db.article.findUnique({
    where: { id },
    include: {
      author: { select: { name: true } },
      sources: { orderBy: { position: "asc" } },
      tags: { include: { tag: true } },
      reviewNotes: { orderBy: { createdAt: "desc" }, include: { admin: { select: { name: true } } } },
    },
  });
  if (!article) notFound();

  const [categories, conditions] = await Promise.all([
    db.category.findMany({ orderBy: { position: "asc" } }),
    db.condition.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <p className="meta"><Link href="/admin/articles">Articles</Link> / {article.title}</p>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>{article.title}</h1>
        <span className={STATUS_BADGE[article.status]}>{STATUS_LABEL[article.status]}</span>
      </div>
      <p className="meta">By {article.author.name}{article.submittedAt ? ` | Submitted ${formatDate(article.submittedAt)}` : ""}
        {article.status === "published" && <> | <Link href={`/articles/${article.slug}`}>View live</Link></>}
      </p>

      {sp?.done && DONE[sp.done] && <p className="alert alert-ok" role="status" style={{ marginBottom: 12 }}>{DONE[sp.done]}</p>}
      {sp?.saved && <p className="alert alert-ok" role="status" style={{ marginBottom: 12 }}>Saved.</p>}
      {sp?.submitted && <p className="alert alert-info" role="status" style={{ marginBottom: 12 }}>Marked as submitted.</p>}

      <div style={{ margin: "16px 0" }}><ReviewPanel articleId={article.id} status={article.status} /></div>

      {article.reviewNotes.length > 0 && (
        <section aria-label="History" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16 }}>Review history</h2>
          {article.reviewNotes.map((n) => (
            <p key={n.id} className="meta" style={{ margin: "4px 0" }}>
              {formatDate(n.createdAt)}: {n.admin.name} ({n.type.replace("_", " ")}){n.message ? ` - ${n.message}` : ""}
            </p>
          ))}
        </section>
      )}

      <h2 style={{ fontSize: 18 }}>Article content</h2>
      <ArticleEditor article={article} categories={categories} conditions={conditions} isAdmin />
    </>
  );
}
