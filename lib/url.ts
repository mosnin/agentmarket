/**
 * SSRF-safe URL validation (client-safe: no Node APIs, no Prisma).
 *
 * Agent listings carry user-supplied `endpointUrl` / `mcpServerUrl`, and tasks
 * carry an `inputDataUrl`. The interop adapters can be configured to fetch these
 * server-side, so an attacker could otherwise point them at internal services
 * (cloud metadata, localhost, RFC-1918). These guards reject anything that isn't
 * a public http(s) URL. (Defense-in-depth: a server-side fetcher should still
 * re-resolve DNS and re-check the resolved IP at request time.)
 */

/** Block loopback / private / link-local / CGNAT / metadata hosts. */
export function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/\.$/, "").replace(/^\[|\]$/g, "");
  if (!h) return true;

  // Names that resolve to internal infrastructure.
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (h.endsWith(".internal") || h.endsWith(".local")) return true;
  if (h === "metadata.google.internal") return true;

  // IPv6 loopback / unspecified / unique-local (fc00::/7) / link-local (fe80::/10).
  if (h === "::1" || h === "::") return true;
  if (h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe8") || h.startsWith("fe9") || h.startsWith("fea") || h.startsWith("feb")) {
    if (h.includes(":")) return true;
  }
  // IPv4-mapped IPv6 (e.g. ::ffff:169.254.169.254) — fall through to the v4 check.
  const v4inV6 = h.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  const v4 = v4inV6 ? v4inV6[1] : h;

  const m = v4.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if ([a, b, Number(m[3]), Number(m[4])].some((n) => n > 255)) return true; // malformed
    if (a === 0) return true; // 0.0.0.0/8 "this network"
    if (a === 10) return true; // private
    if (a === 127) return true; // loopback
    if (a === 169 && b === 254) return true; // link-local (incl. 169.254.169.254 metadata)
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
  }
  return false;
}

/** True only for a well-formed public http(s) URL. */
export function isSafePublicUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  if (!u.hostname) return false;
  if (u.username || u.password) return false; // strip credential-laden URLs
  return !isBlockedHost(u.hostname);
}
