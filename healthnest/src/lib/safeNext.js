// Only same-site paths are allowed as a post-login destination. Anything else (another site, a
// protocol-relative "//host" URL, a backslash trick) falls back to the default.
export function safeNext(value, fallback = "/account") {
  if (typeof value !== "string" || value.length > 300) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  if (/[\u0000-\u001f]/.test(value)) return fallback;
  return value;
}
