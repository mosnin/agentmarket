import Link from "next/link";
import { Compass, MapPinOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { LandingNav } from "@/components/layout/landing-nav";
import { SiteFooter } from "@/components/layout/site-footer";

/**
 * Global 404 — branded catch-all for any unmatched top-level URL (e.g. /foo).
 * Rendered inside the public/marketing shell (LandingNav + SiteFooter) so that
 * unknown routes stay consistent with the rest of the marketplace.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <LandingNav />

      <main id="main-content" className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-20">
        <div
          className="bg-radial-brand pointer-events-none absolute inset-0 opacity-50"
          aria-hidden="true"
        />
        <div className="relative flex max-w-md flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-card text-brand ring-1 ring-brand/20">
            <MapPinOff className="size-7" aria-hidden="true" />
          </div>

          <p className="mt-6 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            404 · Page not found
          </p>
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground text-balance sm:text-3xl">
            We couldn&apos;t find that page
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
            The page you&apos;re looking for may have moved, or the link might be
            incorrect. Browse the marketplace to discover agents, or head back to
            the home page.
          </p>

          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
            <Link
              href="/marketplace"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              <Compass className="size-4" aria-hidden="true" />
              Browse the marketplace
            </Link>
            <Link
              href="/"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Back home
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
