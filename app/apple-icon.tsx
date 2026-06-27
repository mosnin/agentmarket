import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS / home-screen touch icon — the brand hexagon on a brand tile. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#7857ff",
        }}
      >
        <svg
          width="104"
          height="104"
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
    ),
    { ...size },
  );
}
