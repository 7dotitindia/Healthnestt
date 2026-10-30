import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";
import { USER_STATUS } from "./constants";

// One-time email links. The raw token only ever exists in the email; the database keeps its SHA-256 hash.
export const TOKEN_KINDS = { RESET: "reset", VERIFY: "verify" };
export const RESET_TTL_MS = 60 * 60 * 1000; // password reset links work for 1 hour
export const VERIFY_TTL_MS = 48 * 60 * 60 * 1000; // email verification links work for 48 hours
export const TOKEN_RE = /^[a-f0-9]{64}$/;

const hash = (raw) => createHash("sha256").update(raw).digest("hex");

// Creates a token for the user and returns the raw value to put in the email link.
// Any earlier unused token of the same kind is removed, so only the newest email works.
export async function issueToken(userId, kind, ttlMs) {
  const raw = randomBytes(32).toString("hex");
  await db.authToken.deleteMany({ where: { userId, kind, usedAt: null } });
  await db.authToken.create({ data: { userId, kind, tokenHash: hash(raw), expiresAt: new Date(Date.now() + ttlMs) } });
  return raw;
}

// Looks a token up without using it (so a page can check a link before showing a form).
// Returns { token, user } for a live token on an active account, otherwise null.
export async function findLiveToken(raw, kind) {
  if (typeof raw !== "string" || !TOKEN_RE.test(raw)) return null;
  const token = await db.authToken.findUnique({ where: { tokenHash: hash(raw) }, include: { user: true } });
  if (!token || token.kind !== kind || token.usedAt || token.expiresAt <= new Date()) return null;
  if (token.user.status !== USER_STATUS.ACTIVE) return null;
  return { token, user: token.user };
}

// Marks a token used. Returns false if someone else used it first, so a link can never work twice,
// even if it is opened twice at the same moment.
export async function useToken(tokenId) {
  const { count } = await db.authToken.updateMany({ where: { id: tokenId, usedAt: null }, data: { usedAt: new Date() } });
  return count === 1;
}
