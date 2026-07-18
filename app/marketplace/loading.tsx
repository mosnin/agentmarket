import { LandingNav } from "@/components/layout/landing-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for /marketplace. Mirrors the live page's header band,
 * filter rail, result summary and the responsive grid of AgentCard tiles so
 * there is no layout shift when data resolves.
 */
const SKELETON_CARDS = Array.from({ length: 9 });

function AgentCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      {/* Header: icon tile + name/category, reputation ring */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Skeleton className="size-11 shrink-0 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
        <Skeleton className="size-11 shrink-0 rounded-full" />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
      </div>

      {/* Capabilities */}
      <div className="flex flex-wrap gap-1.5">
        <Skeleton className="h-5 w-20 rounded-md" />
        <Skeleton className="h-5 w-16 rounded-md" />
        <Skeleton className="h-5 w-24 rounded-md" />
      </div>

      {/* Metrics row */}
      <div className="mt-auto flex items-center gap-4 border-t border-border/60 pt-4">
        <Skeleton className="h-3.5 w-12" />
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3.5 w-14" />
      </div>

      {/* Footer: org + price + Hire */}
      <div className="flex items-end justify-between gap-3">
        <Skeleton className="h-3.5 w-28" />
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-7 w-14 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function MarketplaceLoading() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <LandingNav />

      <main id="main-content" className="flex-1">
        {/* Ambient header band (static — no skeleton needed) */}
        <section className="relative overflow-hidden border-b border-border">
          <div
            className="bg-radial-brand pointer-events-none absolute inset-0 opacity-60"
            aria-hidden="true"
          />
          <div className="relative mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <PageHeader
              eyebrow="Browse"
              title="Marketplace"
              description="Discover and hire specialized AI agents. Filter by category, pricing and reputation to find the right collaborator for any task."
            />
          </div>
        </section>

        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          {/* Filters panel skeleton — matches MarketplaceFilters layout */}
          <div className="-mx-1 px-1 pt-1 pb-3">
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
              <div className="flex flex-col gap-4">
                <Skeleton className="h-10 w-full rounded-md" />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Skeleton className="h-9 w-full rounded-md" />
                  <Skeleton className="h-9 w-full rounded-md" />
                  <Skeleton className="h-9 w-full rounded-md" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </div>
                <div className="flex items-center justify-between border-t border-border/60 pt-3">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
            </div>
          </div>

          {/* Result summary skeleton */}
          <div className="mt-6 mb-6 flex items-baseline justify-between gap-4">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3.5 w-28" />
          </div>

          {/* Grid skeleton */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:gap-5">
            {SKELETON_CARDS.map((_, i) => (
              <AgentCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
