import Link from "next/link";
import { Activity, ArrowLeft } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { SITE_NAME } from "@/lib/constants";

// Card layout shared by the public sign-in and sign-up pages.
export default function AuthShell({ eyebrow, title, intro, children, footer }) {
  return (
    <main className="login-page">
      <div className="login-top">
        <Link href="/" className="login-back"><ArrowLeft className="size-4" aria-hidden="true" />Back to site</Link>
        <ThemeToggle />
      </div>
      <div className="login-card">
        <Link href="/" className="brand"><Activity className="size-5" aria-hidden="true" />{SITE_NAME}</Link>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="muted" style={{ margin: "0 0 22px", fontSize: 15 }}>{intro}</p>
        {children}
        <p className="meta" style={{ marginTop: 16 }}>{footer}</p>
      </div>
    </main>
  );
}
