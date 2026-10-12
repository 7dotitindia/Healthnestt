import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, ArrowLeft } from "lucide-react";
import LoginForm from "./LoginForm";
import ThemeToggle from "@/components/ThemeToggle";
import { getCurrentUser } from "@/lib/auth";
import { SITE_NAME } from "@/lib/constants";

export const metadata = { title: "Staff sign in", robots: { index: false, follow: false } };

export default async function StaffLoginPage() {
  const user = await getCurrentUser();
  if (user?.role === "admin") redirect("/admin");
  if (user?.role === "freelancer") redirect("/freelancer");

  return (
    <main className="login-page">
      <div className="login-top">
        <Link href="/" className="login-back"><ArrowLeft className="size-4" aria-hidden="true" />Back to site</Link>
        <ThemeToggle />
      </div>
      <div className="login-card">
        <Link href="/" className="brand"><Activity className="size-5" aria-hidden="true" />{SITE_NAME}</Link>
        <p className="eyebrow">Staff area</p>
        <h1>Sign in</h1>
        <p className="muted" style={{ margin: "0 0 22px", fontSize: 15 }}>
          Writers and editors sign in here. Accounts are created by an admin.
        </p>
        <LoginForm />
        <p className="meta" style={{ marginTop: 16 }}>Forgot your password? Ask an admin to reset it.</p>
      </div>
    </main>
  );
}
