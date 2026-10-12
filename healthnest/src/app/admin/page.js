import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/text";
import { Inbox, MessageSquareWarning, CircleCheck, Clock } from "lucide-react";
import StatCard from "@/components/StatCard";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  await requireAdmin();
  const [submitted, changes, published, overdue, queue, top, subs] = await Promise.all([
    db.article.count({ where: { status: "submitted" } }),
    db.article.count({ where: { status: "changes_requested" } }),
    db.article.count({ where: { status: "published" } }),
    db.article.count({ where: { status: "published", nextReviewDueAt: { lt: new Date() } } }),
    db.article.findMany({ where: { status: "submitted" }, orderBy: { submittedAt: "asc" }, take: 8, include: { author: { select: { name: true } } } }),
    db.article.findMany({ where: { status: "published" }, orderBy: { viewCount: "desc" }, take: 5, select: { id: true, title: true, viewCount: true } }),
    db.newsletterSubscriber.count(),
  ]);

  return (
    <>
      <p className="eyebrow">Overview</p>
      <h1 style={{ fontSize: 28, margin: "8px 0 20px" }}>Dashboard</h1>
      <div className="stats">
        <StatCard icon={Inbox} label="Awaiting review" value={submitted} />
        <StatCard icon={MessageSquareWarning} label="Changes requested" value={changes} tone={changes ? "bad" : "default"} />
        <StatCard icon={CircleCheck} label="Published" value={published} tone="ok" />
        <StatCard icon={Clock} label="Overdue re-review" value={overdue} tone={overdue ? "warn" : "default"} />
      </div>

      <h2 style={{ fontSize: 18, margin: "36px 0 12px" }}>Needs your attention</h2>
      {queue.length === 0 ? (
        <div className="empty-state">
          <CircleCheck className="size-6" style={{ color: "var(--primary)" }} aria-hidden="true" />
          <b style={{ color: "var(--foreground)" }}>You&apos;re all caught up</b>
          <span>Nothing is waiting for review.</span>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="t">
            <thead><tr><th>Article</th><th>Author</th><th>Submitted</th><th></th></tr></thead>
            <tbody>
              {queue.map((a) => (
                <tr key={a.id}>
                  <td>{a.title}</td><td>{a.author.name}</td><td className="tnum">{formatDate(a.submittedAt)}</td>
                  <td><Link className="btn btn-secondary btn-sm" href={`/admin/articles/${a.id}`}>Review</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 style={{ fontSize: 18, margin: "36px 0 12px" }}>Most viewed</h2>
      {top.length === 0 ? (
        <p className="muted">No views yet.</p>
      ) : (
        <ol className="card" style={{ listStyle: "none", margin: 0, padding: "6px 18px", display: "grid" }}>
          {top.map((a, i) => (
            <li key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: i ? "1px solid var(--border)" : 0 }}>
              <span className="tnum" style={{ width: 22, color: "var(--text-3)", fontWeight: 700 }}>{i + 1}</span>
              <span style={{ flex: 1, minWidth: 0, fontWeight: 600 }}>{a.title}</span>
              <span className="meta tnum" style={{ whiteSpace: "nowrap" }}>{a.viewCount} {a.viewCount === 1 ? "view" : "views"}</span>
            </li>
          ))}
        </ol>
      )}
      <p className="meta" style={{ marginTop: 16 }}>
        {subs} newsletter {subs === 1 ? "subscriber" : "subscribers"}. Views count once per visitor per article every 30 minutes and skip crawlers.
      </p>
    </>
  );
}
