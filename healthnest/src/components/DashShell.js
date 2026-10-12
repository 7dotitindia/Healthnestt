import { Suspense } from "react";
import Link from "next/link";
import { Activity, ExternalLink, LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { SITE_NAME } from "@/lib/constants";
import DashNav from "@/components/DashNav";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

// Shell for the freelancer and admin areas: a slim top bar and a sidebar that becomes a scrollable strip on phones.
export default function DashShell({ user, links, home, children }) {
  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="dash-app">
      <header className="dash-top">
        <Link href={home} className="brand"><Activity className="size-5" aria-hidden="true" />{SITE_NAME}</Link>
        <span className="dash-role">{user.role === "admin" ? "Admin" : "Writer"}</span>
        <div className="dash-top-right">
          <Link href="/" className="dash-site-link" target="_blank" rel="noopener"><ExternalLink className="size-4" aria-hidden="true" />View site</Link>
          <ThemeToggle />
          <span className="dash-user" title={`${user.name} (${user.role})`}>
            <span className="dash-avatar" aria-hidden="true">{initials}</span>
            <span className="dash-user-name">{user.name}</span>
          </span>
          <form action={logout}>
            <Button type="submit" variant="outline" size="sm"><LogOut aria-hidden="true" />Sign out</Button>
          </form>
        </div>
      </header>
      <div className="dash">
        <aside className="dash-side">
          <Suspense fallback={null}><DashNav links={links} /></Suspense>
        </aside>
        <main id="main-staff" className="dash-main">{children}</main>
      </div>
    </div>
  );
}
