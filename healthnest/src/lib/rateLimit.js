// Small in-memory rate limiter. Fine for a single server process in development.
// Replace with a shared store (Redis/Upstash) before running multiple instances.
const hits = new Map();

export function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now > entry.reset) {
    hits.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  entry.count += 1;
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
  }
  return entry.count <= limit;
}
