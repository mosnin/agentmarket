import { describe, it, expect } from "vitest";

import { checkRateLimit, pruneRateLimitStore } from "./rateLimit";

const opts = { limit: 3, windowMs: 1000 };

describe("checkRateLimit", () => {
  it("allows up to the limit within a window, then blocks with a retry hint", () => {
    const store = new Map();
    expect(checkRateLimit("k", opts, 0, store).ok).toBe(true);
    expect(checkRateLimit("k", opts, 10, store).ok).toBe(true);
    const third = checkRateLimit("k", opts, 20, store);
    expect(third.ok).toBe(true);
    expect(third.remaining).toBe(0);
    const blocked = checkRateLimit("k", opts, 30, store);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("resets after the window elapses", () => {
    const store = new Map();
    checkRateLimit("k", opts, 0, store);
    checkRateLimit("k", opts, 0, store);
    checkRateLimit("k", opts, 0, store);
    expect(checkRateLimit("k", opts, 0, store).ok).toBe(false);
    expect(checkRateLimit("k", opts, 1000, store).ok).toBe(true);
  });

  it("tracks keys independently", () => {
    const store = new Map();
    for (let i = 0; i < 3; i++) checkRateLimit("a", opts, 0, store);
    expect(checkRateLimit("a", opts, 0, store).ok).toBe(false);
    expect(checkRateLimit("b", opts, 0, store).ok).toBe(true);
  });
});

describe("pruneRateLimitStore", () => {
  it("removes only expired buckets", () => {
    const store = new Map();
    checkRateLimit("old", opts, 0, store);
    checkRateLimit("fresh", opts, 900, store);
    pruneRateLimitStore(1500, store);
    expect(store.has("old")).toBe(false);
    expect(store.has("fresh")).toBe(true);
  });
});
