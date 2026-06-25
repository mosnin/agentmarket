"use client";

import * as React from "react";

/**
 * Root-layout error boundary. Only triggers when the root layout itself throws,
 * so it must render its own <html>/<body>. Kept dependency-free and self-styled
 * (dark, high-contrast) so it renders even if app chrome failed to mount.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090b",
          color: "#fafafa",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          padding: "4rem 1.5rem",
        }}
      >
        <div
          style={{
            maxWidth: "28rem",
            width: "100%",
            textAlign: "center",
            border: "1px dashed #27272a",
            borderRadius: "0.75rem",
            backgroundColor: "rgba(24,24,27,0.4)",
            padding: "3.5rem 1.5rem",
          }}
        >
          <h1 style={{ fontSize: "1.125rem", fontWeight: 600, margin: 0 }}>
            Something went wrong
          </h1>
          <p
            style={{
              marginTop: "0.5rem",
              fontSize: "0.875rem",
              lineHeight: 1.6,
              color: "#a1a1aa",
            }}
          >
            A critical error interrupted the application.
          </p>
          {error.digest ? (
            <p
              style={{
                marginTop: "0.75rem",
                fontFamily: "ui-monospace, monospace",
                fontSize: "0.75rem",
                color: "#71717a",
              }}
            >
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            onClick={reset}
            style={{
              marginTop: "1.25rem",
              cursor: "pointer",
              borderRadius: "0.5rem",
              border: "1px solid transparent",
              backgroundColor: "#fafafa",
              color: "#09090b",
              fontSize: "0.875rem",
              fontWeight: 500,
              padding: "0.5rem 1rem",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
