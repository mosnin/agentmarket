/**
 * API authentication + request helpers for the programmable `/api/*` endpoints.
 *
 * If `API_BEARER_TOKENS` is set (comma-separated), mutating routes require a
 * matching `Authorization: Bearer <token>`. When unset (local/demo) the API is
 * open and runs as the mock operator — documented, and explicitly NOT the
 * production posture: set the env (and wire real per-agent auth) before exposing
 * writes publicly.
 */

import { isRealAuthConfigured } from "@/lib/authConfig";

export interface ApiTokenEntry {
  token: string;
  /** Optional principal this token authenticates as (from `token=email` syntax). */
  principalEmail?: string;
}

/** Parse one `API_BEARER_TOKENS` entry: `token` or `token=principal@email`. */
export function parseTokenEntry(raw: string): ApiTokenEntry {
  const eq = raw.indexOf("=");
  if (eq === -1) return { token: raw.trim() };
  return {
    token: raw.slice(0, eq).trim(),
    principalEmail: raw.slice(eq + 1).trim() || undefined,
  };
}

const configuredEntries: ApiTokenEntry[] = (process.env.API_BEARER_TOKENS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .map(parseTokenEntry);

const configuredTokens = configuredEntries.map((e) => e.token);

export const isApiAuthConfigured = configuredEntries.length > 0;

/** Pull the token out of an `Authorization: Bearer <token>` header. */
export function extractBearer(header: string | null | undefined): string | null {
  if (!header) return null;
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  return m ? m[1].trim() : null;
}

/** Membership check against the configured token set (open when none configured). */
export function isAuthorizedToken(
  token: string | null,
  tokens: string[] = configuredTokens,
): boolean {
  if (tokens.length === 0) return true; // mock mode: open
  if (!token) return false;
  return tokens.includes(token);
}

export interface TokenResolution {
  authorized: boolean;
  principalEmail?: string;
}

/** Authorize a bearer token and resolve the principal it maps to (if any). */
export function resolveTokenPrincipal(
  token: string | null,
  entries: ApiTokenEntry[] = configuredEntries,
): TokenResolution {
  if (entries.length === 0) return { authorized: true }; // mock mode: open
  if (!token) return { authorized: false };
  const match = entries.find((e) => e.token === token);
  if (!match) return { authorized: false };
  return { authorized: true, principalEmail: match.principalEmail };
}

export type ApiAuthResult =
  | { ok: true; principalEmail?: string; authenticated: boolean }
  | { ok: false; status: number; error: string };

/**
 * Authorize a write against the programmable API.
 *
 * Fail-closed in production: if real auth is configured (a Clerk-backed
 * deployment) but `API_BEARER_TOKENS` is unset, writes are DENIED rather than
 * run open as the service operator — otherwise forgetting the token env would
 * expose every mutating route as admin. Only the pure demo posture (no real auth
 * AND no tokens) leaves the API open.
 *
 * `authenticated` is true only when a bearer token was actually verified, so the
 * caller can bind the trusted service-operator principal for that case alone.
 */
export function apiAuth(
  request: Request,
  opts: { apiConfigured?: boolean; realAuthConfigured?: boolean } = {},
): ApiAuthResult {
  const apiConfigured = opts.apiConfigured ?? isApiAuthConfigured;
  const realAuthConfigured = opts.realAuthConfigured ?? isRealAuthConfigured;

  if (!apiConfigured) {
    if (realAuthConfigured) {
      return {
        ok: false,
        status: 401,
        error:
          "API authentication is required in this environment. Configure API_BEARER_TOKENS.",
      };
    }
    return { ok: true, authenticated: false }; // demo mode: open
  }
  const token = extractBearer(request.headers.get("authorization"));
  const resolution = resolveTokenPrincipal(token);
  if (!resolution.authorized) {
    return { ok: false, status: 401, error: "Missing or invalid API token." };
  }
  return {
    ok: true,
    principalEmail: resolution.principalEmail,
    authenticated: true,
  };
}

/** Best-effort client key for rate limiting (first XFF hop, else x-real-ip). */
export function clientKey(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export type JsonBodyResult =
  | { ok: true; body: unknown }
  | { ok: false; status: number; error: string };

/** Read + parse a JSON body with a hard size cap (default 64 KB) to blunt DoS. */
export async function readJsonBody(
  request: Request,
  maxBytes = 64 * 1024,
): Promise<JsonBodyResult> {
  const declared = Number(request.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > maxBytes) {
    return { ok: false, status: 413, error: "Request body too large." };
  }

  // Stream the body and abort the moment it exceeds the cap, so a client that
  // omits or understates Content-Length can't force unbounded buffering first.
  let text: string;
  const stream = request.body;
  if (stream) {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value) continue;
        total += value.byteLength;
        if (total > maxBytes) {
          await reader.cancel();
          return { ok: false, status: 413, error: "Request body too large." };
        }
        chunks.push(value);
      }
    } catch {
      return { ok: false, status: 400, error: "Could not read request body." };
    }
    const merged = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.byteLength;
    }
    text = new TextDecoder().decode(merged);
  } else {
    try {
      text = await request.text();
    } catch {
      return { ok: false, status: 400, error: "Could not read request body." };
    }
    if (new TextEncoder().encode(text).byteLength > maxBytes) {
      return { ok: false, status: 413, error: "Request body too large." };
    }
  }

  if (!text.trim()) {
    return { ok: false, status: 400, error: "Request body must be valid JSON" };
  }
  try {
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return { ok: false, status: 400, error: "Request body must be valid JSON" };
  }
}
