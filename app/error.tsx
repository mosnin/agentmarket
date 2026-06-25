"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";

/**
 * Root error boundary. Catches render/data errors thrown anywhere in the app
 * tree that isn't covered by a more specific segment `error.tsx`. Renders an
 * on-brand "Something went wrong" panel (matching the EmptyState/PageHeader
 * chrome) with a retry action instead of the framework default screen.
 */
export default function GlobalAppError({
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
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-16 text-center">
      <div className="flex w-full max-w-md flex-col items-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-14">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/20">
          <AlertTriangle className="size-6 text-destructive" />
        </div>

        <h1 className="font-heading text-lg font-medium text-foreground text-balance">
          Something went wrong
        </h1>
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground text-pretty">
          An unexpected error interrupted this page. You can retry, or head back
          to the marketplace.
        </p>
        {error.digest ? (
          <p className="mt-3 font-mono text-xs text-muted-foreground/70">
            Reference: {error.digest}
          </p>
        ) : null}

        <div className="mt-5 flex items-center gap-2">
          <Button onClick={reset}>
            <RotateCcw aria-hidden="true" />
            Try again
          </Button>
          <Link href="/marketplace" className={buttonVariants({ variant: "outline" })}>
            Back to marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}
