import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { saveImage, MAX_BYTES, StorageNotConfigured } from "@/lib/storage";
import { ROLES } from "@/lib/constants";

const json = (body, status = 200) => Response.json(body, { status });

export async function POST(req) {
  // Same-origin only. Browsers send Origin on cross-site POSTs.
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) return json({ error: "Forbidden." }, 403);

  const user = await getCurrentUser();
  if (!user || (user.role !== ROLES.ADMIN && user.role !== ROLES.FREELANCER)) {
    return json({ error: "Please sign in." }, 401);
  }
  if (!rateLimit(`upload:${user.id}`, 30, 10 * 60 * 1000)) {
    return json({ error: "Too many uploads. Please wait a few minutes." }, 429);
  }

  // Reject oversize requests before reading them into memory.
  const declared = Number(req.headers.get("content-length") || 0);
  if (declared > MAX_BYTES + 100_000) return json({ error: "Image is too large (max 4 MB)." }, 413);

  let file;
  try {
    file = (await req.formData()).get("file");
  } catch {
    return json({ error: "Invalid upload." }, 400);
  }
  if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
    return json({ error: "Choose an image file." }, 400);
  }
  if (file.size === 0) return json({ error: "That file is empty." }, 400);
  if (file.size > MAX_BYTES) return json({ error: "Image is too large (max 4 MB)." }, 413);

  let saved;
  try {
    saved = await saveImage(Buffer.from(await file.arrayBuffer()));
  } catch (e) {
    console.error("Image upload failed:", e);
    if (e instanceof StorageNotConfigured) return json({ error: "Image uploads aren't set up yet. Please ask the site admin to connect image storage." }, 503);
    return json({ error: "We couldn't save that image. Please try again in a moment." }, 502);
  }
  if (!saved) return json({ error: "Only JPEG, PNG or WebP images are allowed." }, 415);

  const asset = await db.mediaAsset.create({
    data: {
      filename: saved.filename,
      url: saved.url,
      mimeType: saved.mimeType,
      sizeBytes: saved.sizeBytes,
      originalName: String(file.name || "").slice(0, 120) || null,
      uploadedById: user.id,
    },
  });
  return json({ id: asset.id, url: asset.url });
}
