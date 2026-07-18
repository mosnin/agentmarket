import { describe, it, expect, beforeEach, vi } from "vitest";

import { withIdempotency, __resetIdempotencyStore } from "./idempotency";

/** A promise plus externally-callable resolve/reject, for controlling timing in tests. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  __resetIdempotencyStore();
  vi.restoreAllMocks();
});

describe("withIdempotency", () => {
  it("runs fn on the first call and reports replayed: false", async () => {
    const fn = vi.fn().mockResolvedValue("first");
    const outcome = await withIdempotency("k1", 1000, fn);
    expect(outcome).toEqual({ result: "first", replayed: false });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("replays the cached result within the TTL without re-running fn", async () => {
    const fn = vi.fn().mockResolvedValue("cached");
    const first = await withIdempotency("k2", 1000, fn);
    const second = await withIdempotency("k2", 1000, fn);
    expect(first).toEqual({ result: "cached", replayed: false });
    expect(second).toEqual({ result: "cached", replayed: true });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("tracks distinct keys independently", async () => {
    const fnA = vi.fn().mockResolvedValue("a");
    const fnB = vi.fn().mockResolvedValue("b");
    const a = await withIdempotency("key-a", 1000, fnA);
    const b = await withIdempotency("key-b", 1000, fnB);
    expect(a).toEqual({ result: "a", replayed: false });
    expect(b).toEqual({ result: "b", replayed: false });
    expect(fnA).toHaveBeenCalledTimes(1);
    expect(fnB).toHaveBeenCalledTimes(1);
  });

  it("treats the key as fresh again once the TTL expires", async () => {
    const nowSpy = vi.spyOn(Date, "now");
    const fn = vi.fn().mockResolvedValueOnce("first").mockResolvedValueOnce("second");

    nowSpy.mockReturnValue(0);
    const first = await withIdempotency("k3", 100, fn);
    expect(first).toEqual({ result: "first", replayed: false });

    nowSpy.mockReturnValue(50);
    const stillCached = await withIdempotency("k3", 100, fn);
    expect(stillCached).toEqual({ result: "first", replayed: true });

    nowSpy.mockReturnValue(150);
    const fresh = await withIdempotency("k3", 100, fn);
    expect(fresh).toEqual({ result: "second", replayed: false });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("dedupes concurrent in-flight calls, running fn exactly once", async () => {
    const { promise, resolve } = deferred<string>();
    const fn = vi.fn(() => promise);

    const call1 = withIdempotency("k4", 1000, fn);
    const call2 = withIdempotency("k4", 1000, fn);

    resolve("shared");

    const [result1, result2] = await Promise.all([call1, call2]);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(result1).toEqual({ result: "shared", replayed: false });
    expect(result2).toEqual({ result: "shared", replayed: true });
  });

  it("does not cache a rejection, so a retry with the same key can succeed", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce("recovered");

    await expect(withIdempotency("k5", 1000, fn)).rejects.toThrow("boom");

    const retry = await withIdempotency("k5", 1000, fn);
    expect(retry).toEqual({ result: "recovered", replayed: false });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("propagates a rejection to concurrent in-flight waiters without re-running fn", async () => {
    const { promise, reject } = deferred<string>();
    const fn = vi.fn(() => promise);

    const call1 = withIdempotency("k6", 1000, fn);
    const call2 = withIdempotency("k6", 1000, fn);

    reject(new Error("shared failure"));

    await expect(call1).rejects.toThrow("shared failure");
    await expect(call2).rejects.toThrow("shared failure");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
