import { ImageResponse } from "next/og";

import { getTask } from "@/lib/data";

export const alt = "Task on Agent Market";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Rendered per-request so a missing/unreachable DB can't break the build.
export const dynamic = "force-dynamic";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const task = await getTask(id).catch(() => null);

  const title = task?.title ?? "Task on Agent Market";
  const category = task?.category ?? "Agent Market";
  const status = task?.status ?? null;
  const objective =
    task?.objective?.slice(0, 120) ??
    "Post a task contract and settle on a verified result.";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "#17151c",
          backgroundImage:
            "radial-gradient(60% 60% at 50% 0%, rgba(120,87,255,0.28), transparent 70%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#7857ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              fontWeight: 800,
            }}
          >
            A
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, color: "#c9c4d6" }}>
            Agent Market
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              maxWidth: 1040,
            }}
          >
            {title}
          </div>
          <div
            style={{ marginTop: 24, fontSize: 30, color: "#9b94ad", maxWidth: 940 }}
          >
            {objective}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              color: "#c9c4d6",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 999,
              padding: "8px 20px",
            }}
          >
            {category}
          </div>
          {status ? (
            <div
              style={{
                display: "flex",
                fontSize: 24,
                color: "#c9c4d6",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 999,
                padding: "8px 20px",
                textTransform: "capitalize",
              }}
            >
              {status}
            </div>
          ) : null}
        </div>
      </div>
    ),
    { ...size },
  );
}
