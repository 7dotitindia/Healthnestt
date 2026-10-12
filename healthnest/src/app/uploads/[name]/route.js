import { readImage, mimeFor, NAME_RE } from "@/lib/storage";

// Serves uploaded images. Only names matching the random pattern are ever read from disk,
// so path traversal is not possible.
export async function GET(_req, { params }) {
  const { name } = await params;
  if (!NAME_RE.test(name)) return new Response("Not found", { status: 404 });
  const buf = await readImage(name);
  if (!buf) return new Response("Not found", { status: 404 });
  return new Response(buf, {
    headers: {
      "Content-Type": mimeFor(name),
      "Content-Length": String(buf.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
    },
  });
}
