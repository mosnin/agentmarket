import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Centered empty state: an icon set in a soft tinted circle, a title, an
 * optional muted description, and an optional action node (e.g. a CTA button).
 * Used whenever a list / table / panel has no data to show.
 * Server component.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-14 text-center",
        className,
      )}
    >
      {Icon ? (
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-brand/10 ring-1 ring-brand/20">
          <Icon className="size-6 text-brand" />
        </div>
      ) : null}

      <h3 className="font-heading text-base font-medium text-foreground text-balance">
        {title}
      </h3>

      {description ? (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground text-pretty">
          {description}
        </p>
      ) : null}

      {action ? <div className="mt-5 flex items-center gap-2">{action}</div> : null}
    </div>
  );
}
