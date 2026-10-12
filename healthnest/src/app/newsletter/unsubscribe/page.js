import Link from "next/link";
import { CheckCircle2, MailX, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { unsubscribe } from "@/app/actions/newsletter";

export const dynamic = "force-dynamic";
export const metadata = { title: "Unsubscribe", robots: { index: false, follow: false } };

const TOKEN_RE = /^[A-Za-z0-9_-]{20,128}$/;

export default async function UnsubscribePage({ searchParams }) {
  const sp = await searchParams;
  const token = typeof sp?.token === "string" && TOKEN_RE.test(sp.token) ? sp.token : null;

  if (sp?.state === "done") return <Notice icon={CheckCircle2} title="You're unsubscribed" text="We won't email you again. You can sign up any time from the home page." />;
  if (sp?.state === "invalid") return <Notice icon={TriangleAlert} tone="warn" title="This link isn't valid" text="It may be incomplete. If you keep getting emails you don't want, reply to one and we'll remove you." />;

  const sub = token ? await db.newsletterSubscriber.findUnique({ where: { token } }) : null;
  if (!sub) return <Notice icon={TriangleAlert} tone="warn" title="This link isn't valid" text="It may be incomplete. If you keep getting emails you don't want, reply to one and we'll remove you." />;
  if (sub.status === "unsubscribed") return <Notice icon={CheckCircle2} title="Already unsubscribed" text="This address is not on our list." />;

  return (
    <Shell>
      <span className="bento-icon" style={{ width: 48, height: 48 }}><MailX aria-hidden="true" strokeWidth={1.75} style={{ width: 24, height: 24 }} /></span>
      <h1 className="h-section" style={{ marginTop: 16 }}>Unsubscribe?</h1>
      <p className="muted">Stop the Healthnestt weekly email for <b style={{ color: "var(--foreground)" }}>{sub.email}</b>.</p>
      <form action={unsubscribe} style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input type="hidden" name="token" value={token} />
        <Button type="submit" size="lg">Unsubscribe</Button>
        <Button asChild variant="outline" size="lg"><Link href="/">Keep me subscribed</Link></Button>
      </form>
    </Shell>
  );
}

function Shell({ children }) {
  return <div className="wrap-narrow section" style={{ paddingBlock: 64 }}><div className="card" style={{ padding: 32 }}>{children}</div></div>;
}

function Notice({ icon: Icon, title, text, tone }) {
  return (
    <Shell>
      <span className="bento-icon" style={tone === "warn" ? { width: 48, height: 48, background: "var(--warning-bg)", color: "var(--warning-fg)" } : { width: 48, height: 48 }}>
        <Icon aria-hidden="true" strokeWidth={1.75} style={{ width: 24, height: 24 }} />
      </span>
      <h1 className="h-section" style={{ marginTop: 16 }}>{title}</h1>
      <p className="muted">{text}</p>
      <p style={{ marginTop: 20 }}><Button asChild variant="outline"><Link href="/">Back to Healthnestt</Link></Button></p>
    </Shell>
  );
}
