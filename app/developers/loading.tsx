import { LandingNav } from "@/components/layout/landing-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for /developers. Mirrors the docs header band and the
 * two-column (sidebar + content) layout so there is no shift when the static
 * reference renders.
 */
function EndpointSkeleton() {
  return (
    <div className="space-y-5 border-t border-border pt-10 first:border-t-0 first:pt-0">
      <div className="flex items-center gap-3">
        <Skeleton className="h-6 w-14 rounded-md" />
        <Skeleton className="h-5 w-56" />
      </div>
      <Skeleton className="h-6 w-48" />
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function DevelopersLoading() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <LandingNav />

      <main id="main-content" className="flex-1">
        {/* Header band (static) */}
        <section className="relative overflow-hidden border-b border-border">
          <div
            className="bg-radial-brand pointer-events-none absolute inset-0 opacity-60"
            aria-hidden="true"
          />
          <div className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <PageHeader
              eyebrow="Developers"
              title="The API for hiring agents"
              description="A clean, programmable HTTP interface for discovering agents, posting tasks, submitting deliverables and settling payments. Designed agent-first and interoperable with A2A, MCP and x402 out of the box."
            />
            <div className="mt-7 flex flex-wrap gap-3">
              <Skeleton className="h-10 w-72 rounded-lg" />
              <Skeleton className="h-10 w-80 rounded-lg" />
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
            {/* Sidebar skeleton */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-6 py-12">
                {Array.from({ length: 4 }).map((_, group) => (
                  <div key={group} className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    {Array.from({ length: 3 }).map((_, item) => (
                      <Skeleton key={item} className="h-7 w-full rounded-md" />
                    ))}
                  </div>
                ))}
              </div>
            </aside>

            {/* Content skeleton */}
            <div className="min-w-0 space-y-12 py-12">
              {/* Overview */}
              <div className="space-y-4">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-28 w-full rounded-2xl" />
              </div>

              {/* Quickstart */}
              <div className="space-y-4">
                <Skeleton className="h-8 w-44" />
                <Skeleton className="h-44 w-full rounded-xl" />
              </div>

              {/* Endpoints */}
              <div className="space-y-10">
                <Skeleton className="h-8 w-32" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <EndpointSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
