"use client";

import * as React from "react";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"] as const;

/**
 * Accessible 1–5 star rating input: a `radiogroup` of star buttons with a hover
 * preview and a live text label. Controlled via `value` + `onChange`.
 */
export function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [hover, setHover] = React.useState<number | null>(null);
  const active = hover ?? value;

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center gap-1"
        role="radiogroup"
        aria-label="Star rating"
        onMouseLeave={() => setHover(null)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= active;
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`${star} star${star === 1 ? "" : "s"}`}
              onClick={() => onChange(star)}
              onMouseEnter={() => setHover(star)}
              className="rounded-md p-0.5 outline-none transition-transform hover:scale-110 focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              <Star
                className={cn(
                  "size-7 transition-colors",
                  filled
                    ? "fill-amber-400 text-amber-400"
                    : "fill-transparent text-muted-foreground/40",
                )}
              />
            </button>
          );
        })}
      </div>
      <span className="text-sm font-medium tabular-nums text-muted-foreground">
        {active > 0 ? `${active} · ${RATING_LABELS[active]}` : "Tap to rate"}
      </span>
    </div>
  );
}
