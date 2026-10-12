import DashShell from "@/components/DashShell";
import { requireFreelancer } from "@/lib/auth";

export const metadata = { title: "Writer dashboard", robots: { index: false, follow: false } };

const LINKS = [
  { href: "/freelancer", label: "My articles", icon: "mine" },
  { href: "/freelancer/new", label: "New article", icon: "write" },
];

export default async function FreelancerLayout({ children }) {
  const user = await requireFreelancer();
  return <DashShell user={user} links={LINKS} home="/freelancer">{children}</DashShell>;
}
