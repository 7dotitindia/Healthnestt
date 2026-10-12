import Link from "next/link";
import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import AuthShell from "@/components/AuthShell";
import { getCurrentUser } from "@/lib/auth";
import { safeNext } from "@/lib/safeNext";

export const metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }) {
  const next = safeNext((await searchParams).next);
  const user = await getCurrentUser();
  if (user) redirect(user.role === "admin" ? "/admin" : user.role === "freelancer" ? "/freelancer" : next);

  const qs = next === "/account" ? "" : `?next=${encodeURIComponent(next)}`;
  return (
    <AuthShell
      eyebrow="Your account"
      title="Sign in"
      intro="Save articles to read later and keep them on every device."
      footer={<>New here? <Link href={`/signup${qs}`}>Create an account</Link>. Writers and editors can also sign in here.</>}
    >
      <AuthForm mode="login" next={next} />
    </AuthShell>
  );
}
