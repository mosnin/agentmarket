import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

interface Tier {
  /** stroke color for the progress arc */
  stroke: string;
  /** text color for the numeric value */
  text: string;
}

function tierFor(score: number): Tier {
  if (score >= 90) return { stroke: "stroke-emerald-400", text: "text-emerald-400" };
  if (score >= 80) return { stroke: "stroke-lime-400", text: "text-lime-400" };
  if (score >= 70) return { stroke: "stroke-amber-400", text: "text-amber-400" };
  return { stroke: "stroke-rose-400", text: "text-rose-400" };
}

const SIZES: Record<
  Size,
  { box: number; stroke: number; value: string; label: string; gap: string }
> = {
  sm: { box: 36, stroke: 3, value: "text-[11px]", label: "text-[9px]", gap: "gap-2" },
  md: { box: 48, stroke: 3.5, value: "text-sm", label: "text-[10px]", gap: "gap-2.5" },
  lg: { box: 72, stroke: 5, value: "text-xl", label: "text-[11px]", gap: "gap-3" },
};

/**
 * Premium 0–100 reputation display: a tier-colored SVG progress ring with the
 * score rendered in its center. Optionally shows a "rep" label beside the ring.
 */
export function ReputationScore({
  score,
  size = "md",
  showLabel = false,
  className,
}: {
  score: number;
  size?: Size;
  showLabel?: boolean;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const tier = tierFor(clamped);
  const dims = SIZES[size];

  const radius = (dims.box - dims.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div
      className={cn("inline-flex items-center", dims.gap, className)}
      title={`Reputation ${clamped}/100`}
    >
      <div className="relative shrink-0" style={{ width: dims.box, height: dims.box }}>
        <svg
          width={dims.box}
          height={dims.box}
          viewBox={`0 0 ${dims.box} ${dims.box}`}
          className="-rotate-90"
          aria-hidden="true"
        >
          <circle
            cx={dims.box / 2}
            cy={dims.box / 2}
            r={radius}
            fill="none"
            strokeWidth={dims.stroke}
            className="stroke-muted"
          />
          <circle
            cx={dims.box / 2}
            cy={dims.box / 2}
            r={radius}
            fill="none"
            strokeWidth={dims.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn("transition-[stroke-dashoffset]", tier.stroke)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-semibold tabular-nums", dims.value, tier.text)}>
            {clamped}
          </span>
        </div>
      </div>
      {showLabel ? (
        <div className="flex flex-col leading-tight">
          <span className={cn("font-medium text-foreground", dims.value)}>Reputation</span>
          <span className={cn("uppercase tracking-wide text-muted-foreground", dims.label)}>
            {clamped} / 100 rep
          </span>
        </div>
      ) : null}
    </div>
  );
}
