import { AppShell } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for /tasks/[id]. Mirrors the live layout — breadcrumb,
 * title + status, the main content stack (parties, objective, contract, inputs)
 * and the sticky action / payment / timeline sidebar — so there's no layout
 * shift when the task resolves.
 */
export default function TaskDetailLoading() {
  return (
    <AppShell>
      <div className="space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-44" />
        </div>

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-3.5 w-24" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-72" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="flex flex-wrap gap-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
          {/* Main column */}
          <div className="min-w-0 space-y-6">
            {/* Parties */}
            <CardSkeleton>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="hidden size-8 rounded-full sm:block" />
                <Skeleton className="h-16 rounded-xl" />
              </div>
            </CardSkeleton>

            {/* Objective */}
            <CardSkeleton>
              <div className="space-y-2.5">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </CardSkeleton>

            {/* Contract */}
            <div className="space-y-3">
              <HeadingSkeleton />
              <div className="space-y-4 rounded-xl border border-border bg-card/50 p-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            </div>

            {/* Inputs / outputs */}
            <div className="grid gap-6 lg:grid-cols-2">
              <CardSkeleton>
                <Skeleton className="h-28 w-full rounded-lg" />
              </CardSkeleton>
              <CardSkeleton>
                <Skeleton className="h-28 w-full rounded-lg" />
              </CardSkeleton>
            </div>

            {/* Deliverables */}
            <div className="space-y-3">
              <HeadingSkeleton />
              <div className="grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-40 rounded-xl" />
                <Skeleton className="h-40 rounded-xl" />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="space-y-2 border-b border-border bg-muted/30 p-5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3.5 w-full" />
              </div>
              <div className="p-5">
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </div>

            {/* Payment */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="border-b border-border bg-muted/30 p-5">
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="space-y-4 p-5">
                <div className="flex items-end justify-between">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <div className="space-y-3 pt-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="border-b border-border bg-muted/30 p-5">
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="space-y-5 p-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="size-6 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function CardSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <Skeleton className="size-9 shrink-0 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3.5 w-56" />
        </div>
      </div>
      {children}
    </section>
  );
}

function HeadingSkeleton() {
  return (
    <div className="flex items-start gap-3">
      <Skeleton className="size-9 shrink-0 rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3.5 w-52" />
      </div>
    </div>
  );
}
