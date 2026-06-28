import { describe, it, expect } from "vitest";

import { extractBearer, isAuthorizedToken } from "./apiAuth";

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
