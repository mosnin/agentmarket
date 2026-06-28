import { NextResponse } from "next/server";

import { checkRateLimit } from "@/lib/rateLimit";
import { apiAuth, clientKey } from "@/lib/apiAuth";
import { apiError } from "./serializers";

// Reads are cheap and idempotent; writes are scarcer and authenticated.
const READ_LIMIT = { limit: 120, windowMs: 60_000 };
const WRITE_LIMIT = { limit: 30, windowMs: 60_000 };

/**
 * Per-route guard for the programmable API. Rate-limits every call (by client
 * IP) and additionally requires API auth on writes. Returns a ready-to-return
 * `NextResponse` when the request must be rejected, or `null` to proceed.
 */
export function guardApi(
  request: Request,
  opts: { write?: boolean } = {},
): NextResponse | null {
  const scope = opts.write ? "w" : "r";
  const limit = opts.write ? WRITE_LIMIT : READ_LIMIT;
  const rl = checkRateLimit(`${scope}:${clientKey(request)}`, limit);
  if (!rl.ok) {
    return NextResponse.json(
      apiError("Rate limit exceeded. Please slow down.", "rate_limited"),
      {
        status: 429,
        headers: {
          "Retry-After": String(rl.retryAfterSec),
          "RateLimit-Limit": String(rl.limit),
          "RateLimit-Remaining": "0",
        },
      },
    );
  }
  if (opts.write) {
    const auth = apiAuth(request);
    if (!auth.ok) {
      return NextResponse.json(apiError(auth.error, "unauthorized"), {
        status: auth.status,
      });
    }
  }
  return null;
}
