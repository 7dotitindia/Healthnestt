"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { sendEmail, emailConfig } from "@/lib/email";
import { testEmail } from "@/lib/emailTemplates";
import { ROLES } from "@/lib/constants";

// Admin-only. Sends one test email to the admin's own address (never to a typed-in address,
// so this button cannot be used to send mail to other people).
export async function sendTestEmail() {
  const user = await getCurrentUser();
  if (!user || user.role !== ROLES.ADMIN) redirect("/staff/login");
  if (!rateLimit(`test-email:${user.id}`, 5, 10 * 60 * 1000)) redirect("/admin/emails?test=limit");

  const result = await sendEmail({ to: user.email, kind: "test", ...testEmail({ provider: emailConfig().provider }) });
  redirect(`/admin/emails?test=${result.status}`);
}
