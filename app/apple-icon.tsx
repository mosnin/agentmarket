import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS / home-screen touch icon — the node-graph "A" mark on a brand tile. */
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
        <svg width="112" height="112" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 4 L4.5 20 M12 4 L19.5 20 M7.3 14 L16.7 14"
            stroke="#ffffff"
            strokeWidth={1.8}
            strokeLinecap="round"
            opacity={0.6}
          />
          <circle cx="4.5" cy="20" r="2.1" fill="#ffffff" />
          <circle cx="19.5" cy="20" r="2.1" fill="#ffffff" />
          <circle cx="12" cy="4" r="2.5" fill="#ffffff" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
