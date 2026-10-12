import Link from "next/link";
import { CheckCircle2, MailCheck, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { confirmSubscription } from "@/app/actions/newsletter";
import { isConfirmationExpired } from "@/lib/newsletterState";

export const dynamic = "force-dynamic";
export const metadata = { title: "Confirm your subscription", robots: { index: false, follow: false } };

const TOKEN_RE = /^[A-Za-z0-9_-]{20,128}$/;

export default async function ConfirmPage({ searchParams }) {
  const sp = await searchParams;
  const token = typeof sp?.token === "string" && TOKEN_RE.test(sp.token) ? sp.token : null;

  // Result screens (reached after pressing the button).
  if (sp?.state === "done") return <Notice icon={CheckCircle2} title="You're subscribed" text="Thanks for confirming. You'll get our weekly email, and every email has an unsubscribe link." />;
  if (sp?.state === "expired") return <Notice icon={TriangleAlert} tone="warn" title="This link has expired" text="Confirmation links last 7 days. Sign up again from the home page and we'll send a fresh one." />;
  if (sp?.state === "invalid") return <Notice icon={TriangleAlert} tone="warn" title="This link isn't valid" text="It may have been replaced by a newer email, or already used. Sign up again from the home page to get a new one." />;

  const sub = token ? await db.newsletterSubscriber.findUnique({ where: { token } }) : null;
  if (!sub || sub.status === "unsubscribed") return <Notice icon={TriangleAlert} tone="warn" title="This link isn't valid" text="It may have been replaced by a newer email, or already used. Sign up again from the home page to get a new one." />;
  if (sub.status === "confirmed") return <Notice icon={CheckCircle2} title="Already confirmed" text="This address is already subscribed. Nothing more to do." />;
  if (isConfirmationExpired(sub.consentAt)) return <Notice icon={TriangleAlert} tone="warn" title="This link has expired" text="Confirmation links last 7 days. Sign up again from the home page and we'll send a fresh one." />;

  return (
    <Shell>
      <span className="bento-icon" style={{ width: 48, height: 48 }}><MailCheck aria-hidden="true" strokeWidth={1.75} style={{ width: 24, height: 24 }} /></span>
      <h1 className="h-section" style={{ marginTop: 16 }}>Confirm your subscription</h1>
      <p className="muted">Press the button to start receiving the Healthnestt weekly email at <b style={{ color: "var(--foreground)" }}>{sub.email}</b>.</p>
      <form action={confirmSubscription} style={{ marginTop: 20 }}>
        <input type="hidden" name="token" value={token} />
        <Button type="submit" size="lg">Confirm subscription</Button>
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
