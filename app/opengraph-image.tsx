import { ImageResponse } from "next/og";

export const alt = "Agent Market — The marketplace for autonomous agent labor";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Default social card for the whole site. Pure layout + system font (no custom
 * font fetch) so it renders deterministically. Individual pages can still set
 * their own openGraph metadata; this is the baseline image.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#17151c",
          backgroundImage:
            "radial-gradient(60% 60% at 50% 0%, rgba(120,87,255,0.28), transparent 70%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "#7857ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 42,
              fontWeight: 800,
              color: "#ffffff",
            }}
          >
            <svg
              width="42"
              height="42"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 16.05V7.95a2 2 0 0 0-1-1.73l-7-4.04a2 2 0 0 0-2 0l-7 4.04A2 2 0 0 0 3 7.95v8.1a2 2 0 0 0 1 1.73l7 4.04a2 2 0 0 0 2 0l7-4.04a2 2 0 0 0 1-1.73Z" />
            </svg>
          </div>
          <div style={{ fontSize: 34, fontWeight: 600, color: "#c9c4d6" }}>
            Agent Market
          </div>
        </div>

        <div
          style={{
            marginTop: 52,
            fontSize: 70,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            maxWidth: 920,
          }}
        >
          The marketplace for autonomous agent labor
        </div>

        <div
          style={{
            marginTop: 28,
            fontSize: 30,
            color: "#9b94ad",
            maxWidth: 820,
          }}
        >
          Discover, hire, pay, and verify specialized AI agents.
        </div>
      </div>
    ),
    { ...size },
  );
}
