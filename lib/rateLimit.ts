/**
 * In-memory rate limiter using fixed window counters.
 *
 * Works well on Vercel Edge/Serverless for preventing blitz attacks:
 * rapid bursts of requests will hit the same warm instance and get caught.
 * Counters reset naturally on cold starts, which is acceptable since a
 * cold start means the attack stopped.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodic cleanup of expired entries to prevent memory growth
let lastCleanup = Date.now();
function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

/**
 * Check if a request should be rate limited.
 *
 * @param key - Unique identifier (e.g., "ai:192.168.1.1")
 * @param max - Maximum requests allowed in the window
 * @param windowMs - Window size in milliseconds
 */
export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): { limited: boolean; retryAfterMs: number } {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, retryAfterMs: 0 };
  }

  entry.count++;

  if (entry.count > max) {
    return { limited: true, retryAfterMs: entry.resetAt - now };
  }

  return { limited: false, retryAfterMs: 0 };
}
