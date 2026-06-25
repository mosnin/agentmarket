import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Polished page title block used at the top of every dashboard / detail view.
 *
 * Layout: an optional uppercase eyebrow, a large heading, a muted description,
 * and a right-aligned actions slot that wraps below the title on small screens.
 * Server component (no client-only APIs).
 */
export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-2">
        {eyebrow ? (
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-heading text-2xl leading-tight font-semibold tracking-tight text-foreground text-balance sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <div className="max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty sm:text-[0.95rem]">
            {description}
          </div>
        ) : null}
      </div>

      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
