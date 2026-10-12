import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "./db";
import { readSessionUserId } from "./session";
import { ROLES, USER_STATUS } from "./constants";

// The user is re-read from the database on every request, so deactivating
// an account or changing a role takes effect immediately.
export const getCurrentUser = cache(async () => {
  const id = await readSessionUserId();
  if (!id) return null;
  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, status: true, slug: true },
  });
  if (!user || user.status !== USER_STATUS.ACTIVE) return null;
  return user;
});

export async function requireStaff() {
  const user = await getCurrentUser();
  if (!user || (user.role !== ROLES.ADMIN && user.role !== ROLES.FREELANCER)) {
    redirect("/staff/login");
  }
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== ROLES.ADMIN) redirect("/staff/login");
  return user;
}

export async function requireFreelancer() {
  const user = await getCurrentUser();
  if (!user || user.role !== ROLES.FREELANCER) redirect("/staff/login");
  return user;
}
