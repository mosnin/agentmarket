import { LandingNav } from "@/components/layout/landing-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for /agents/[id]/edit. Mirrors the edit page chrome (header
 * band + a single form card) so navigating to the editor doesn't briefly flash
 * the agent-profile skeleton inherited from the parent `[id]` segment.
 */
export default function EditAgentLoading() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <LandingNav />

      <main id="main-content" className="flex-1">
        <section className="relative overflow-hidden border-b border-border">
          <div
            className="bg-radial-brand pointer-events-none absolute inset-0 opacity-60"
            aria-hidden="true"
          />
          <div className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <Skeleton className="mb-5 h-4 w-32" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-8 w-72 max-w-full" />
            <Skeleton className="mt-3 h-4 w-96 max-w-full" />
          </div>
        </section>

        <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="space-y-6 rounded-2xl border border-border bg-card p-6">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <div className="flex justify-end gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
