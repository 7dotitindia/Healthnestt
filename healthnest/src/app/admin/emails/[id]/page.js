import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Pulls the links out of the email's HTML so a logged email can be tested by clicking through it.
function linksIn(html) {
  const out = [];
  for (const m of html.matchAll(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = m[1].replace(/&amp;/g, "&");
    if (/^https?:\/\//i.test(href)) out.push({ href, label: m[2].replace(/<[^>]*>/g, "").trim() || href });
  }
  return out;
}

export default async function EmailDetail({ params }) {
  await requireAdmin();
  const { id } = await params;
  const mail = await db.emailLog.findUnique({ where: { id } });
  if (!mail) notFound();
  const links = linksIn(mail.html);

  return (
    <>
      <p className="meta"><Link href="/admin/emails">Emails</Link> / {mail.subject}</p>
      <h1 style={{ fontSize: 24, margin: "8px 0 4px" }}>{mail.subject}</h1>
      <p className="meta tnum">
        To {mail.to} &middot; {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(mail.createdAt)} &middot; {mail.provider} &middot; <b>{mail.status}</b>
      </p>
      {mail.error && <p className="alert alert-bad" role="alert" style={{ margin: "12px 0" }}>{mail.error}</p>}

      {links.length > 0 && (
        <div className="card" style={{ padding: 16, margin: "16px 0" }}>
          <b style={{ fontSize: 14 }}>Links in this email</b>
          <ul style={{ margin: "8px 0 0", paddingLeft: 0, listStyle: "none", display: "grid", gap: 6 }}>
            {links.map((l) => (
              <li key={l.href} style={{ display: "flex", gap: 8, alignItems: "baseline", minWidth: 0 }}>
                <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" style={{ color: "var(--primary)" }} />
                <a href={l.href} style={{ wordBreak: "break-all" }}>{l.label}</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <h2 style={{ fontSize: 16, margin: "24px 0 8px" }}>As it looks</h2>
      {/* sandbox="" turns off scripts, forms and navigation inside the preview. */}
      <iframe title="Email preview" sandbox="" srcDoc={mail.html} style={{ width: "100%", height: 520, border: "1px solid var(--border)", borderRadius: 16, background: "#fff" }} />

      <h2 style={{ fontSize: 16, margin: "24px 0 8px" }}>Plain-text version</h2>
      <pre className="card" style={{ padding: 16, whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: 13, margin: 0 }}>{mail.text}</pre>
    </>
  );
}
