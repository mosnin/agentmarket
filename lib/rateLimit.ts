/**
 * In-memory fixed-window rate limiter.
 *
 * Per-instance only (no shared store): a solid first line of defense for a single
 * Node server. Behind multiple serverless instances, back it with a shared store
 * (Redis/Upstash) using the same interface. The core is pure — `now` and `store`
 * are injectable — so it is deterministically unit-tested.
 */

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  retryAfterSec: number;
}

type Bucket = { count: number; resetAt: number };

const globalStore = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  opts: RateLimitOptions,
  now: number = Date.now(),
  store: Map<string, Bucket> = globalStore,
): RateLimitResult {
  const bucket = store.get(key);
  if (!bucket || now >= bucket.resetAt) {
    store.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true, limit: opts.limit, remaining: opts.limit - 1, retryAfterSec: 0 };
  }
  if (bucket.count >= opts.limit) {
    return {
      ok: false,
      limit: opts.limit,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  bucket.count += 1;
  return { ok: true, limit: opts.limit, remaining: opts.limit - bucket.count, retryAfterSec: 0 };
}

/** Drop expired buckets so the store doesn't grow unbounded. */
export function pruneRateLimitStore(
  now: number = Date.now(),
  store: Map<string, Bucket> = globalStore,
): void {
  for (const [k, b] of store) if (now >= b.resetAt) store.delete(k);
}
