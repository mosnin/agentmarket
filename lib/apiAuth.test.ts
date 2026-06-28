import { describe, it, expect } from "vitest";

import { extractBearer, isAuthorizedToken, readJsonBody } from "./apiAuth";

function postReq(body: string): Request {
  return new Request("http://localhost/api", { method: "POST", body });
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
