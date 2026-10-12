import Link from "next/link";
import { db } from "@/lib/db";
import { requireFreelancer } from "@/lib/auth";
import { STATUS_BADGE, STATUS_LABEL } from "@/lib/constants";
import { formatDate } from "@/lib/text";

export const dynamic = "force-dynamic";

export default async function FreelancerHome() {
  const user = await requireFreelancer();
  const articles = await db.article.findMany({
    where: { authorId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { category: true, reviewNotes: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>My articles</h1>
        <Link href="/freelancer/new" className="btn btn-primary">New article</Link>
      </div>

      {articles.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 24 }}><b style={{ color: "var(--foreground)" }}>No articles yet</b><span>Start with a new article. Add your sources, then submit it for review.</span><Link href="/freelancer/new" className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>New article</Link></div>
      ) : (
        <div className="table-scroll" style={{ marginTop: 16 }}>
          <table className="t">
            <thead><tr><th>Title</th><th>Category</th><th>Status</th><th>Updated</th><th></th></tr></thead>
            <tbody>
              {articles.map((a) => (
                <tr key={a.id}>
                  <td>
                    {a.title}
                    {a.status === "changes_requested" && a.reviewNotes[0]?.message && (
                      <div className="meta" style={{ marginTop: 4 }}>Feedback: {a.reviewNotes[0].message.slice(0, 120)}</div>
                    )}
                  </td>
                  <td>{a.category?.name || "-"}</td>
                  <td><span className={STATUS_BADGE[a.status]}>{STATUS_LABEL[a.status]}</span></td>
                  <td>{formatDate(a.updatedAt)}</td>
                  <td><Link href={`/freelancer/articles/${a.id}`}>{a.status === "draft" || a.status === "changes_requested" ? "Edit" : "View"}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
