import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/text";

export const dynamic = "force-dynamic";

export default async function Subscribers() {
  await requireAdmin();
  const subs = await db.newsletterSubscriber.findMany({ orderBy: { consentAt: "desc" }, take: 500 });
  return (
    <>
      <h1 style={{ fontSize: 24, marginTop: 0 }}>Newsletter subscribers ({subs.length})</h1>
      <p className="meta">People stay &ldquo;pending&rdquo; until they press the confirm button in their email. Those emails are listed under <Link href="/admin/emails">Emails</Link>.</p>
      {subs.length === 0 ? <div className="empty-state"><b style={{ color: "var(--foreground)" }}>No subscribers yet</b><span>People who sign up on the site will appear here.</span></div> : (
        <div className="table-scroll">
          <table className="t">
            <thead><tr><th>Email</th><th>Status</th><th>Source</th><th>Signed up</th></tr></thead>
            <tbody>{subs.map((s) => <tr key={s.id}><td>{s.email}</td><td>{s.status}</td><td>{s.source || "-"}</td><td>{formatDate(s.consentAt)}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </>
  );
}
