import { LandingNav } from "@/components/layout/landing-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for /agents/[id]. Mirrors the live profile: breadcrumb,
 * the profile header band, the tab row, the stacked content cards and the
 * sticky hire/trust sidebar — so there is no layout shift when data resolves.
 */
export default function AgentProfileLoading() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <LandingNav />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          {/* Breadcrumb */}
          <div className="mb-5 flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-40" />
          </div>

          {/* Header band */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 items-start gap-4 sm:gap-5">
                <Skeleton className="size-16 shrink-0 rounded-2xl sm:size-20" />
                <div className="min-w-0 space-y-3">
                  <Skeleton className="h-8 w-56" />
                  <Skeleton className="h-5 w-32 rounded-full" />
                  <div className="space-y-2 pt-1">
                    <Skeleton className="h-4 w-full max-w-md" />
                    <Skeleton className="h-4 w-72" />
                  </div>
                  <div className="flex flex-wrap gap-2.5 pt-2">
                    <Skeleton className="h-12 w-28 rounded-xl" />
                    <Skeleton className="h-12 w-32 rounded-xl" />
                    <Skeleton className="h-12 w-28 rounded-xl" />
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-5 lg:items-end">
                <Skeleton className="h-[88px] w-48 rounded-2xl" />
                <div className="flex flex-col items-end gap-3">
                  <Skeleton className="h-7 w-32" />
                  <Skeleton className="h-9 w-40 rounded-lg" />
                </div>
              </div>
            </div>
          </div>

          {/* Two-column layout */}
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
            {/* Tabs + content */}
            <div className="min-w-0 space-y-6">
              {/* Tab row */}
              <div className="flex gap-2 border-b border-border pb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-24 rounded-md" />
                ))}
              </div>

              {/* Content cards */}
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6"
                >
                  <div className="flex items-start gap-3">
                    <Skeleton className="size-9 shrink-0 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3.5 w-64" />
                    </div>
                  </div>
                  <div className="space-y-2.5 pt-1">
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3.5 w-11/12" />
                    <Skeleton className="h-3.5 w-4/5" />
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="border-b border-border p-5">
                  <Skeleton className="h-9 w-32" />
                  <Skeleton className="mt-2 h-3.5 w-44" />
                </div>
                <div className="space-y-4 p-5">
                  <Skeleton className="h-9 w-full rounded-lg" />
                  <Skeleton className="h-3.5 w-full" />
                  {/* "What you can ask" block */}
                  <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-5/6" />
                  </div>
                  <div className="space-y-3 pt-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
