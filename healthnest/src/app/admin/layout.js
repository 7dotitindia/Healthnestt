import DashShell from "@/components/DashShell";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/articles?status=submitted", label: "Review queue", icon: "review" },
  { href: "/admin/articles", label: "All articles", icon: "articles" },
  { href: "/admin/articles/new", label: "New article", icon: "write" },
  { href: "/admin/categories", label: "Categories", icon: "categories" },
  { href: "/admin/conditions", label: "Conditions", icon: "conditions" },
  { href: "/admin/media", label: "Media", icon: "media" },
  { href: "/admin/users", label: "Users", icon: "users" },
  { href: "/admin/subscribers", label: "Newsletter", icon: "newsletter" },
  { href: "/admin/emails", label: "Emails", icon: "emails" },
];

export default async function AdminLayout({ children }) {
  const user = await requireAdmin();
  return <DashShell user={user} links={LINKS} home="/admin">{children}</DashShell>;
}
