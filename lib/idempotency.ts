/**
 * In-memory idempotency cache for retried POSTs.
 *
 * Ensures the work behind an idempotency key runs exactly once: a call made while
 * an earlier call for the same key is still in-flight awaits that same promise
 * instead of re-invoking `fn`, and a call made after completion replays the cached
 * result until `ttlMs` elapses. Once the TTL passes, the key is fresh again.
 *
 * Per-instance only (no shared store): a solid first line of defense for a single
 * Node server. Behind multiple serverless instances, back it with a shared store
 * (Redis/Upstash) using the same interface. Failed calls are never cached, so a
 * retry after an error is free to try again.
 */

export interface IdempotencyResult<T> {
  result: T;
  replayed: boolean;
}

type Entry =
  | { status: "pending"; promise: Promise<unknown> }
  | { status: "settled"; value: unknown; expiresAt: number };

const globalStore = new Map<string, Entry>();

export async function withIdempotency<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<IdempotencyResult<T>> {
  const existing = globalStore.get(key);

  if (existing) {
    if (existing.status === "pending") {
      // Another caller is already running fn for this key: await its result
      // instead of starting a second execution.
      const result = await existing.promise;
      return { result: result as T, replayed: true };
    }
    if (Date.now() < existing.expiresAt) {
      return { result: existing.value as T, replayed: true };
    }
    // Expired: fall through and treat the key as fresh.
  }

  try {
    const promise = fn();
    globalStore.set(key, { status: "pending", promise });
    const result = await promise;
    globalStore.set(key, { status: "settled", value: result, expiresAt: Date.now() + ttlMs });
    return { result, replayed: false };
  } catch (err) {
    // Do not cache failures — a retry with the same key should be free to
    // re-run fn. In-flight waiters above already observed this rejection via
    // their own `await existing.promise`.
    globalStore.delete(key);
    throw err;
  }
}

/** Test-only: clear all cached/in-flight entries so tests don't leak state across keys. */
export function __resetIdempotencyStore(): void {
  globalStore.clear();
}
