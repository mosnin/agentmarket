import { describe, it, expect } from "vitest";

import {
  apiAuth,
  extractBearer,
  isAuthorizedToken,
  readJsonBody,
  parseTokenEntry,
  resolveTokenPrincipal,
} from "./apiAuth";

function postReq(body: string): Request {
  return new Request("http://localhost/api", { method: "POST", body });
}

function writeReq(auth?: string): Request {
  return new Request("http://localhost/api", {
    method: "POST",
    headers: auth ? { authorization: auth } : undefined,
  });
}

describe("extractBearer", () => {
  it("parses a Bearer token case-insensitively", () => {
    expect(extractBearer("Bearer abc123")).toBe("abc123");
    expect(extractBearer("bearer   xyz")).toBe("xyz");
  });
  it("returns null for missing or malformed headers", () => {
    expect(extractBearer(null)).toBeNull();
    expect(extractBearer("")).toBeNull();
    expect(extractBearer("Token abc")).toBeNull();
    expect(extractBearer("Bearer")).toBeNull();
  });
});

describe("isAuthorizedToken", () => {
  it("is open when no tokens are configured (mock mode)", () => {
    expect(isAuthorizedToken(null, [])).toBe(true);
    expect(isAuthorizedToken("anything", [])).toBe(true);
  });
  it("requires a configured token otherwise", () => {
    const tokens = ["secret-a", "secret-b"];
    expect(isAuthorizedToken("secret-a", tokens)).toBe(true);
    expect(isAuthorizedToken("secret-b", tokens)).toBe(true);
    expect(isAuthorizedToken("nope", tokens)).toBe(false);
    expect(isAuthorizedToken(null, tokens)).toBe(false);
  });
});

describe("parseTokenEntry", () => {
  it("parses a bare token", () => {
    expect(parseTokenEntry("tok_abc")).toEqual({ token: "tok_abc" });
  });
  it("parses a token=email mapping", () => {
    expect(parseTokenEntry("tok_abc=agent@x.dev")).toEqual({
      token: "tok_abc",
      principalEmail: "agent@x.dev",
    });
  });
  it("treats an empty email as no principal", () => {
    expect(parseTokenEntry("tok_abc=")).toEqual({ token: "tok_abc" });
  });
});

describe("resolveTokenPrincipal", () => {
  const entries = [
    { token: "tok_a", principalEmail: "a@x.dev" },
    { token: "tok_b" },
  ];
  it("is open with no configured entries (mock mode)", () => {
    expect(resolveTokenPrincipal(null, [])).toEqual({ authorized: true });
  });
  it("authorizes and maps a token to its principal", () => {
    expect(resolveTokenPrincipal("tok_a", entries)).toEqual({
      authorized: true,
      principalEmail: "a@x.dev",
    });
  });
  it("authorizes a bare token with no principal", () => {
    expect(resolveTokenPrincipal("tok_b", entries)).toEqual({ authorized: true });
  });
  it("rejects an unknown or missing token", () => {
    expect(resolveTokenPrincipal("nope", entries)).toEqual({ authorized: false });
    expect(resolveTokenPrincipal(null, entries)).toEqual({ authorized: false });
  });
});

describe("apiAuth (config-gated write authorization)", () => {
  it("is open (unauthenticated) in pure demo mode — no real auth, no API tokens", () => {
    const r = apiAuth(writeReq(), {
      apiConfigured: false,
      realAuthConfigured: false,
    });
    expect(r).toEqual({ ok: true, authenticated: false });
  });

  it("FAILS CLOSED when real auth is configured but API tokens are not", () => {
    // The dangerous foot-gun: a Clerk-configured (production) deployment that
    // forgot API_BEARER_TOKENS must NOT leave writes open as the service admin.
    const r = apiAuth(writeReq("Bearer whatever"), {
      apiConfigured: false,
      realAuthConfigured: true,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(401);
  });
});

describe("readJsonBody", () => {
  it("parses valid JSON within the cap", async () => {
    const r = await readJsonBody(postReq(JSON.stringify({ a: 1 })));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.body).toEqual({ a: 1 });
  });
  it("rejects invalid JSON with 400", async () => {
    const r = await readJsonBody(postReq("not json"));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(400);
  });
  it("rejects bodies over the byte cap with 413", async () => {
    const r = await readJsonBody(postReq(JSON.stringify({ big: "x".repeat(500) })), 64);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(413);
  });
});
