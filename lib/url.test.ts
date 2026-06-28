import { describe, it, expect } from "vitest";

import { isBlockedHost, isSafePublicUrl } from "./url";

describe("isBlockedHost", () => {
  it("blocks loopback / localhost", () => {
    expect(isBlockedHost("localhost")).toBe(true);
    expect(isBlockedHost("127.0.0.1")).toBe(true);
    expect(isBlockedHost("::1")).toBe(true);
  });
  it("blocks RFC-1918 private ranges", () => {
    expect(isBlockedHost("10.0.0.5")).toBe(true);
    expect(isBlockedHost("172.16.4.2")).toBe(true);
    expect(isBlockedHost("172.31.255.1")).toBe(true);
    expect(isBlockedHost("192.168.1.1")).toBe(true);
  });
  it("blocks link-local incl. the cloud metadata IP, and CGNAT", () => {
    expect(isBlockedHost("169.254.169.254")).toBe(true);
    expect(isBlockedHost("100.64.0.1")).toBe(true);
    expect(isBlockedHost("metadata.google.internal")).toBe(true);
    expect(isBlockedHost("svc.internal")).toBe(true);
  });
  it("allows public hosts", () => {
    expect(isBlockedHost("example.com")).toBe(false);
    expect(isBlockedHost("8.8.8.8")).toBe(false);
    expect(isBlockedHost("172.15.0.1")).toBe(false); // just outside private range
    expect(isBlockedHost("172.32.0.1")).toBe(false);
  });
});

describe("isSafePublicUrl", () => {
  it("accepts public http(s) URLs", () => {
    expect(isSafePublicUrl("https://api.example.com/v1/run")).toBe(true);
    expect(isSafePublicUrl("http://example.com")).toBe(true);
  });
  it("rejects non-URLs and non-http schemes", () => {
    expect(isSafePublicUrl("not a url")).toBe(false);
    expect(isSafePublicUrl("ftp://example.com")).toBe(false);
    expect(isSafePublicUrl("file:///etc/passwd")).toBe(false);
    expect(isSafePublicUrl("javascript:alert(1)")).toBe(false);
  });
  it("rejects internal / loopback / metadata targets (SSRF)", () => {
    expect(isSafePublicUrl("http://localhost:3000/admin")).toBe(false);
    expect(isSafePublicUrl("http://127.0.0.1")).toBe(false);
    expect(isSafePublicUrl("http://169.254.169.254/latest/meta-data/")).toBe(false);
    expect(isSafePublicUrl("http://10.0.0.1/internal")).toBe(false);
  });
  it("rejects credential-laden URLs", () => {
    expect(isSafePublicUrl("https://user:pass@example.com")).toBe(false);
  });
});
