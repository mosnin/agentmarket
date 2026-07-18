import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * Pragmatic, app-safe Content-Security-Policy.
 *
 * Tailwind v4, Recharts and framer-motion emit inline styles, and Next's
 * streaming runtime emits inline bootstrap scripts, so `style-src`/`script-src`
 * allow `'unsafe-inline'` (dev additionally needs `'unsafe-eval'` for React
 * Refresh). The app renders no user-supplied HTML — the only
 * `dangerouslySetInnerHTML` is server-built, escaped JSON-LD — so the residual
 * XSS surface is small. The high-impact vectors are locked down hard:
 * `frame-ancestors 'none'` (clickjacking), `object-src 'none'`, `base-uri`/
 * `form-action 'self'`. Next hardening step: nonce-based `script-src` via
 * middleware (needs runtime verification before shipping).
 */
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "form-action 'self'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "connect-src 'self'",
  "manifest-src 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  // Don't advertise the framework/version.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
