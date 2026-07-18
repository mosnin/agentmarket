import * as React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * KPI / stat card for the dashboard grid.
 *
 * Deliberately quiet: an uppercase label, a large tabular value, an optional
 * delta chip (tokenized success/destructive) and an optional hint. No icon —
 * a KPI reads as a number, not a badge. The value is the focal point.
 * Server component.
 */
export function MetricCard({
  label,
  value,
  hint,
  delta,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  delta?: { value: string; positive?: boolean };
  className?: string;
}) {
  const deltaPositive = delta?.positive ?? true;

  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 rounded-xl border border-border bg-card p-5",
        className,
      )}
    >
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>

      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span className="font-heading text-2xl leading-none font-semibold tracking-tight tabular-nums text-foreground sm:text-3xl">
          {value}
        </span>
        {delta ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums",
              deltaPositive
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive",
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
