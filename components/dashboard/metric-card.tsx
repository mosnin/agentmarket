import * as React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Premium KPI / stat card for the dashboard grid.
 *
 * Shows a small uppercase label, a large value, an optional icon tile, an
 * optional hint line, and an optional delta chip (green when `positive`, red
 * otherwise). Subtle border with a tasteful hover lift. Server component.
 */
export function MetricCard({
  label,
  value,
  icon: Icon,
  hint,
  delta,
  accent,
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  hint?: string;
  delta?: { value: string; positive?: boolean };
  /** Optional Tailwind text-color class for the icon tile glyph (e.g. "text-brand"). */
  accent?: string;
  className?: string;
}) {
  const deltaPositive = delta?.positive ?? true;

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/15 hover:bg-card/80",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        {Icon ? (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 ring-1 ring-border transition-colors group-hover:bg-muted">
            <Icon className={cn("size-4.5 text-muted-foreground", accent)} />
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span className="font-heading text-2xl leading-none font-semibold tracking-tight tabular-nums text-foreground sm:text-3xl">
          {value}
        </span>
        {delta ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums",
              deltaPositive
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-rose-500/10 text-rose-400",
            )}
          >
            {deltaPositive ? (
              <ArrowUpRight className="size-3" aria-hidden="true" />
            ) : (
              <ArrowDownRight className="size-3" aria-hidden="true" />
            )}
            {delta.value}
          </span>
        ) : null}
      </div>

      {hint ? (
        <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
