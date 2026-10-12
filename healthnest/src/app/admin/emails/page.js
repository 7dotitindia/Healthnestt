import Link from "next/link";
import { CheckCircle2, Info, Send, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { emailConfig } from "@/lib/email";
import { sendTestEmail } from "@/app/actions/emails";

export const dynamic = "force-dynamic";

const KIND = {
  newsletter_confirm: "Newsletter confirmation",
  article_submitted: "Article submitted",
  changes_requested: "Changes requested",
  article_approved: "Article approved",
  article_published: "Article published",
  test: "Test",
};
const STATUS = { logged: "badge badge-info", sent: "badge badge-ok", failed: "badge badge-bad" };

export default async function EmailsPage({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const cfg = emailConfig();
  const logs = await db.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: 100, select: { id: true, to: true, subject: true, kind: true, status: true, createdAt: true } });

  return (
    <>
      <p className="eyebrow">Email</p>
      <h1 style={{ fontSize: 28, margin: "8px 0 20px" }}>Emails</h1>

      {sp?.test === "logged" && <p className="alert alert-info" role="status" style={{ marginBottom: 14 }}>Test email saved to the log below. Nothing was sent, because no email provider is connected.</p>}
      {sp?.test === "sent" && <p className="alert alert-ok" role="status" style={{ marginBottom: 14 }}>Test email sent to your address. Check your inbox.</p>}
      {sp?.test === "failed" && <p className="alert alert-bad" role="alert" style={{ marginBottom: 14 }}>The test email failed. Open the newest entry below to see why.</p>}
      {sp?.test === "limit" && <p className="alert alert-warn" role="alert" style={{ marginBottom: 14 }}>That&apos;s a lot of test emails. Wait a few minutes and try again.</p>}

      <div className="card" style={{ padding: 20, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {cfg.provider === "resend"
            ? <span className="badge badge-ok"><CheckCircle2 className="size-3" style={{ display: "inline", marginRight: 4 }} aria-hidden="true" />Sending through Resend</span>
            : <span className="badge badge-warn"><Info className="size-3" style={{ display: "inline", marginRight: 4 }} aria-hidden="true" />Log only: no emails are leaving the site</span>}
          <span className="meta">From: {cfg.from}</span>
        </div>
        {cfg.misconfigured && (
          <p className="alert alert-warn" style={{ margin: 0 }}>
            <TriangleAlert className="size-4" style={{ display: "inline", marginRight: 6 }} aria-hidden="true" />
            <code>EMAIL_PROVIDER</code> is set to <code>resend</code> but <code>RESEND_API_KEY</code> is empty, so emails are only being logged.
          </p>
        )}
        {cfg.provider === "log" && (
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            Every email is saved below so you can read it and click its links, exactly as a reader would. To send for real, set <code>EMAIL_PROVIDER=resend</code>, <code>RESEND_API_KEY</code> and <code>EMAIL_FROM</code> (an address on a domain you have verified at Resend), then restart the site. See the README.
          </p>
        )}
        <form action={sendTestEmail}>
          <Button type="submit" variant="outline" size="sm"><Send aria-hidden="true" />Send me a test email</Button>
        </form>
      </div>

      <h2 style={{ fontSize: 18, margin: "32px 0 12px" }}>Recent emails</h2>
      {logs.length === 0 ? (
        <div className="empty-state"><b style={{ color: "var(--foreground)" }}>No emails yet</b><span>Newsletter signups and article activity will show up here.</span></div>
      ) : (
        <div className="table-scroll">
          <table className="t">
            <thead><tr><th>When</th><th>To</th><th>Subject</th><th>Type</th><th>Status</th></tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="tnum" style={{ whiteSpace: "nowrap" }}>{new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(l.createdAt)}</td>
                  <td>{l.to}</td>
                  <td><Link href={`/admin/emails/${l.id}`}>{l.subject}</Link></td>
                  <td>{KIND[l.kind] || l.kind}</td>
                  <td><span className={STATUS[l.status] || "badge"}>{l.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
