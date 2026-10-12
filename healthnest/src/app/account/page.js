import Link from "next/link";
import { LogOut } from "lucide-react";
import ArticleRow from "@/components/ArticleRow";
import ProfileForm from "@/components/ProfileForm";
import { Button } from "@/components/ui/button";
import { logoutReader } from "@/app/actions/readers";
import { requireUser } from "@/lib/auth";
import { getBookmarkedArticles } from "@/lib/queries";

export const metadata = { title: "My account", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireUser("/account");
  const saved = await getBookmarkedArticles(user.id);
  const dashboard = user.role === "admin" ? { href: "/admin", label: "Open the admin dashboard" } : user.role === "freelancer" ? { href: "/freelancer", label: "Open the writer dashboard" } : null;

  return (
    <div className="wrap section" style={{ maxWidth: 820 }}>
      <p className="eyebrow">My account</p>
      <h1 style={{ marginBottom: 6 }}>Hello, {user.name.split(" ")[0]}</h1>
      <p className="muted" style={{ margin: "0 0 28px" }}>{user.email}</p>

      {dashboard && <p style={{ marginBottom: 24 }}><Link href={dashboard.href}>{dashboard.label}</Link></p>}

      <section aria-labelledby="saved-title" id="saved" style={{ marginBottom: 40 }}>
        <h2 id="saved-title" style={{ marginBottom: 12 }}>Saved articles</h2>
        {saved.length === 0 ? (
          <p className="muted">
            Nothing saved yet. Open any article and press <strong>Save</strong>. It will show up here. <Link href="/">Browse articles</Link>
          </p>
        ) : (
          <div>{saved.map((a) => <ArticleRow key={a.id} article={a} />)}</div>
        )}
      </section>

      <section aria-labelledby="profile-title" style={{ marginBottom: 40 }}>
        <h2 id="profile-title" style={{ marginBottom: 12 }}>Profile</h2>
        <ProfileForm name={user.name} email={user.email} />
      </section>

      <form action={logoutReader}>
        <Button type="submit" variant="outline"><LogOut aria-hidden="true" />Sign out</Button>
      </form>
    </div>
  );
}
