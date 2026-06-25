import Link from "next/link";
import { FilePlus2, LayoutDashboard, ScrollText } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { AppShell } from "@/components/layout/app-shell";

/**
 * 404 for /tasks/[id] — shown when getTask() returns null for the requested id
 * (a deleted task, or a mistyped/expired link). Rendered inside the app shell so
 * navigation stays available.
 */
export default function TaskNotFound() {
  return (
    <AppShell>
      <div className="relative flex min-h-[60vh] items-center justify-center overflow-hidden px-4 py-16">
        <div
          className="bg-radial-brand pointer-events-none absolute inset-0 opacity-40"
          aria-hidden="true"
        />
        <div className="relative flex max-w-md flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-card text-brand ring-1 ring-brand/20">
            <ScrollText className="size-7" aria-hidden="true" />
          </div>

          <p className="mt-6 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            404 · Task not found
          </p>
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground text-balance sm:text-3xl">
            We couldn&apos;t find that task
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
            This contract may have been removed, or the link might be incorrect.
            Head back to your dashboard to see active tasks, or post a new one.
          </p>

          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
            <Link href="/dashboard" className={cn(buttonVariants({ size: "lg" }))}>
              <LayoutDashboard className="size-4" aria-hidden="true" />
              Go to dashboard
            </Link>
            <Link
              href="/tasks/new"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              <FilePlus2 className="size-4" aria-hidden="true" />
              Post a task
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
