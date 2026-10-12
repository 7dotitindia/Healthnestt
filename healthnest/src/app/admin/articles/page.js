import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { STATUS, STATUS_BADGE, STATUS_LABEL } from "@/lib/constants";
import { formatDate } from "@/lib/text";

export const dynamic = "force-dynamic";

export default async function AdminArticles({ searchParams }) {
  await requireAdmin();
  const { status } = await searchParams;
  const filter = Object.values(STATUS).includes(status) ? status : null;
  const articles = await db.article.findMany({
    where: filter ? { status: filter } : {},
    orderBy: { updatedAt: "desc" },
    include: { author: { select: { name: true } }, category: { select: { name: true } } },
    take: 200,
  });

  return (
    <>
      <h1 style={{ fontSize: 24, marginTop: 0 }}>{filter ? `${STATUS_LABEL[filter]} articles` : "All articles"}</h1>
      <p style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Link href="/admin/articles" className={`badge ${!filter ? "badge-topic" : ""}`} style={{ textDecoration: "none" }}>All</Link>
        {Object.values(STATUS).map((s) => (
          <Link key={s} href={`/admin/articles?status=${s}`} className={`badge ${filter === s ? "badge-topic" : ""}`} style={{ textDecoration: "none" }}>{STATUS_LABEL[s]}</Link>
        ))}
      </p>
      {articles.length === 0 ? <div className="empty-state"><b style={{ color: "var(--foreground)" }}>No articles here</b><span>Nothing matches this filter.</span></div> : (
        <div className="table-scroll">
          <table className="t">
            <thead><tr><th>Title</th><th>Author</th><th>Category</th><th>Status</th><th>Updated</th><th></th></tr></thead>
            <tbody>
              {articles.map((a) => (
                <tr key={a.id}>
                  <td>{a.title}</td><td>{a.author.name}</td><td>{a.category?.name || "-"}</td>
                  <td><span className={STATUS_BADGE[a.status]}>{STATUS_LABEL[a.status]}</span></td>
                  <td>{formatDate(a.updatedAt)}</td>
                  <td><Link href={`/admin/articles/${a.id}`}>Open</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
