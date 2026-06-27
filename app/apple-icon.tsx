import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS / home-screen touch icon — brand tile with the wordmark initial. */
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
          color: "#ffffff",
          fontSize: 112,
          fontWeight: 800,
          fontFamily: "sans-serif",
        }}
      >
        A
      </div>
    ),
    { ...size },
  );
}
