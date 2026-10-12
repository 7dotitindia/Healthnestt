// Browser helper: uploads an image and returns { url } or throws an Error with a readable message.
export const MAX_UPLOAD_MB = 5;

export async function uploadImage(file) {
  if (!file) throw new Error("Choose an image file.");
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) throw new Error(`Image is too large (max ${MAX_UPLOAD_MB} MB).`);
  const body = new FormData();
  body.append("file", file);
  let res;
  try {
    res = await fetch("/api/upload", { method: "POST", body });
  } catch {
    throw new Error("Upload failed. Check your connection and try again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Upload failed.");
  return data;
}
