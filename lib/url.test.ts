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

describe("isSafePublicUrl — IP-encoding SSRF bypasses", () => {
  it("blocks IPv4-mapped IPv6 (hex form) to metadata/loopback/private", () => {
    expect(isSafePublicUrl("http://[::ffff:169.254.169.254]/latest/meta-data/")).toBe(false);
    expect(isSafePublicUrl("http://[::ffff:7f00:1]/")).toBe(false); // 127.0.0.1
    expect(isSafePublicUrl("http://[::ffff:a00:1]/")).toBe(false); // 10.0.0.1
    expect(isSafePublicUrl("http://[::ffff:c0a8:1]/")).toBe(false); // 192.168.0.1
  });
  it("blocks IPv4-mapped IPv6 (dotted form)", () => {
    expect(isSafePublicUrl("http://[::ffff:127.0.0.1]/")).toBe(false);
  });
  it("blocks decimal/octal/hex IPv4 encodings (URL-normalized)", () => {
    expect(isSafePublicUrl("http://2130706433/")).toBe(false); // 127.0.0.1
    expect(isSafePublicUrl("http://0x7f000001/")).toBe(false);
    expect(isSafePublicUrl("http://127.1/")).toBe(false);
  });
  it("still allows a public mapped address", () => {
    expect(isSafePublicUrl("http://[::ffff:8.8.8.8]/")).toBe(true);
  });
});
