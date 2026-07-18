/**
 * SSRF-safe URL validation (client-safe: no Node APIs, no Prisma).
 *
 * Agent listings carry user-supplied `endpointUrl` / `mcpServerUrl`, and tasks
 * carry an `inputDataUrl`. The interop adapters can be configured to fetch these
 * server-side, so an attacker could otherwise point them at internal services
 * (cloud metadata, localhost, RFC-1918). These guards reject anything that isn't
 * a public http(s) URL.
 *
 * Note: the WHATWG `URL` parser normalizes decimal/octal/hex IPv4
 * (`http://2130706433`, `http://0x7f000001`, `http://127.1`) to dotted-decimal,
 * and compresses IPv4-mapped IPv6 to the hex form `::ffff:a9fe:a9fe` — both are
 * handled below. (Defense-in-depth: a server-side fetcher should still re-resolve
 * DNS and re-check the resolved IP at request time, to defeat DNS rebinding.)
 */

/** Is a dotted-decimal IPv4 string in a loopback/private/link-local/CGNAT range? */
function isBlockedIpv4(v4: string): boolean {
  const m = v4.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const octets = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
  if (octets.some((n) => n > 255)) return true; // malformed → treat as unsafe
  const [a, b] = octets;
  if (a === 0) return true; // 0.0.0.0/8 "this network"
  if (a === 10) return true; // private
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local (incl. 169.254.169.254 metadata)
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
  return false;
}

/** Extract the embedded IPv4 from an IPv4-mapped IPv6 host (dotted or hex form). */
function mappedIpv4(h: string): string | null {
  const dotted = h.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (dotted) return dotted[1];
  const hex = h.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hex) {
    const hi = parseInt(hex[1], 16);
    const lo = parseInt(hex[2], 16);
    return `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
  }
  return null;
}

/** Block loopback / private / link-local / CGNAT / metadata hosts. */
export function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/\.$/, "").replace(/^\[|\]$/g, "");
  if (!h) return true;

  // Names that resolve to internal infrastructure.
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (h.endsWith(".internal") || h.endsWith(".local")) return true;
  if (h === "metadata.google.internal") return true;

  // IPv6.
  if (h.includes(":")) {
    if (h === "::1" || h === "::") return true; // loopback / unspecified
    if (/^f[cd]/.test(h)) return true; // unique-local fc00::/7
    if (/^fe[89ab]/.test(h)) return true; // link-local fe80::/10
    const mapped = mappedIpv4(h); // IPv4-mapped (::ffff:… dotted or hex)
    if (mapped) return isBlockedIpv4(mapped);
    const tail = h.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
    if (tail) return isBlockedIpv4(tail[1]);
    return false; // other global-unicast IPv6
  }

  // IPv4 (already normalized to dotted-decimal by the URL parser).
  return isBlockedIpv4(h);
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
