import Link from "next/link";
import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import AuthShell from "@/components/AuthShell";
import { getCurrentUser } from "@/lib/auth";
import { safeNext } from "@/lib/safeNext";

export const metadata = { title: "Create an account", robots: { index: false, follow: false } };

export default async function SignupPage({ searchParams }) {
  const next = safeNext((await searchParams).next);
  if (await getCurrentUser()) redirect(next);

  const qs = next === "/account" ? "" : `?next=${encodeURIComponent(next)}`;
  return (
    <AuthShell
      eyebrow="Join Healthnestt"
      title="Create an account"
      intro="Free. Save articles to read later. We never ask for health information."
      footer={<>Already have an account? <Link href={`/login${qs}`}>Sign in</Link></>}
    >
      <AuthForm mode="signup" next={next} />
    </AuthShell>
  );
}
