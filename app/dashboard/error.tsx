"use client";

import * as React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";

/**
 * Error boundary for /dashboard. A failed metrics/activity read renders an
 * on-brand panel inside the AppShell (sidebar/topbar stay stable) with a retry
 * action, instead of the framework default error screen.
 */
export default function DashboardError({
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
    <AppShell>
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex w-full max-w-md flex-col items-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-14 text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/20">
            <AlertTriangle className="size-6 text-destructive" />
          </div>
          <h2 className="font-heading text-lg font-medium text-foreground text-balance">
            Couldn&apos;t load your dashboard
          </h2>
          <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground text-pretty">
            We hit an error while loading your activity and metrics. This is
            usually temporary — try again in a moment.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <Button onClick={reset}>
              <RotateCcw aria-hidden="true" />
              Try again
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
