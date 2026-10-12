"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { removeImage } from "@/lib/storage";
import { ROLES } from "@/lib/constants";

// Deletes an upload only if no article uses it, so published pages never lose an image.
export async function deleteMedia(formData) {
  const user = await getCurrentUser();
  if (!user || user.role !== ROLES.ADMIN) redirect("/staff/login");

  const asset = await db.mediaAsset.findUnique({ where: { id: String(formData.get("id") || "") } });
  if (!asset) return;

  const inUse = await db.article.count({
    where: { OR: [{ coverImageUrl: asset.url }, { body: { contains: asset.url } }] },
  });
  if (inUse > 0) return;

  await db.mediaAsset.delete({ where: { id: asset.id } });
  await removeImage(asset.filename);
  revalidatePath("/admin/media");
}
