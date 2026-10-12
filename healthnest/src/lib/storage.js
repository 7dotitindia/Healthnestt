import "server-only";
import { randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { put, head, del } from "@vercel/blob";

// All upload storage goes through this module. To move to Cloudinary or S3 later,
// replace saveImage / readImage / removeImage and keep the same return shapes.
// Files live outside /public because Next does not serve files added there after a build.
// UPLOAD_DIR can be overridden (the automated tests write to a temp folder).
export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
// Vercel refuses request bodies over 4.5 MB before our code runs, so the limit sits safely below that.
export const MAX_BYTES = 4 * 1024 * 1024;

// Thrown when uploads are attempted but nowhere can store files (on Vercel the disk is read-only and no Blob store is connected).
export class StorageNotConfigured extends Error {}
export const NAME_RE = /^[a-f0-9]{32}\.(jpg|png|webp)$/;

const TYPES = {
  jpg: { mime: "image/jpeg" },
  png: { mime: "image/png" },
  webp: { mime: "image/webp" },
};

// Detects the real format from the file's first bytes. The browser-supplied
// name and content type are never trusted.
export function sniffImage(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  return null;
}

// On Vercel the filesystem is read-only, so when BLOB_READ_WRITE_TOKEN is set files go to
// Vercel Blob under uploads/<name>. Public URLs stay /uploads/<name> (served by the route).
const blobEnabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export const mimeFor = (name) => TYPES[name.split(".").pop()]?.mime;

export async function saveImage(buf) {
  const ext = sniffImage(buf);
  if (!ext) return null;
  const filename = `${randomBytes(16).toString("hex")}.${ext}`;
  if (blobEnabled()) {
    await put(`uploads/${filename}`, buf, { access: "public", addRandomSuffix: false, contentType: TYPES[ext].mime });
    return { filename, url: `/uploads/${filename}`, mimeType: TYPES[ext].mime, sizeBytes: buf.length };
  }
  if (process.env.VERCEL) throw new StorageNotConfigured("No Blob store is connected (BLOB_READ_WRITE_TOKEN is not set).");
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, filename), buf, { flag: "wx" });
  return { filename, url: `/uploads/${filename}`, mimeType: TYPES[ext].mime, sizeBytes: buf.length };
}

export async function readImage(filename) {
  if (!NAME_RE.test(filename)) return null;
  if (blobEnabled()) {
    try {
      const meta = await head(`uploads/${filename}`);
      const res = await fetch(meta.url);
      return res.ok ? Buffer.from(await res.arrayBuffer()) : null;
    } catch {
      return null;
    }
  }
  try {
    return await fs.readFile(path.join(UPLOAD_DIR, filename));
  } catch {
    return null;
  }
}

export async function removeImage(filename) {
  if (!NAME_RE.test(filename)) return;
  if (blobEnabled()) {
    await del(`uploads/${filename}`).catch(() => {});
    return;
  }
  await fs.rm(path.join(UPLOAD_DIR, filename), { force: true });
}
