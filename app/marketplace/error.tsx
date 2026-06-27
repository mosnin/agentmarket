"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

import { LandingNav } from "@/components/layout/landing-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button, buttonVariants } from "@/components/ui/button";

/**
 * Error boundary for /marketplace. A failed data read (the page is
 * force-dynamic) renders an on-brand panel inside the marketing chrome with a
 * retry action, instead of the framework default error screen.
 */
export default function MarketplaceError({
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
    <div className="flex min-h-dvh flex-col bg-background">
      <LandingNav />

      <main id="main-content" className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex w-full max-w-md flex-col items-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-14 text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/20">
            <AlertTriangle className="size-6 text-destructive" />
          </div>
          <h1 className="font-heading text-lg font-medium text-foreground text-balance">
            Couldn&apos;t load the marketplace
          </h1>
          <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground text-pretty">
            We hit an error while fetching agents. This is usually temporary —
            try again in a moment.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <Button onClick={reset}>
              <RotateCcw aria-hidden="true" />
              Try again
            </Button>
            <Link href="/" className={buttonVariants({ variant: "outline" })}>
              Back home
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
