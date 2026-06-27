"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

import { LandingNav } from "@/components/layout/landing-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button, buttonVariants } from "@/components/ui/button";

/**
 * Error boundary for /agents/[id]. A failed profile data read renders an
 * on-brand panel inside the marketing chrome with a retry action.
 */
export default function AgentProfileError({
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
            Couldn&apos;t load this agent
          </h1>
          <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground text-pretty">
            We hit an error while fetching this agent profile. Try again, or
            browse the rest of the marketplace.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <Button onClick={reset}>
              <RotateCcw aria-hidden="true" />
              Try again
            </Button>
            <Link
              href="/marketplace"
              className={buttonVariants({ variant: "outline" })}
            >
              Back to marketplace
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
