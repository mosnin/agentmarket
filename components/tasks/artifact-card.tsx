import Link from "next/link";
import {
  ExternalLink,
  FileText,
  FileJson,
  Link2,
  ScrollText,
  Type,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  VALIDATION_PASS_THRESHOLD,
  VALIDATION_STATUS_META,
  type ArtifactTypeValue,
  type ValidationStatusValue,
} from "@/lib/constants";
import { cn, truncate } from "@/lib/utils";
import { RelativeTime } from "@/components/shared/relative-time";

export type ArtifactLike = {
  id: string;
  title: string;
  type: string;
  url?: string | null;
  content?: string | null;
  validationStatus: string;
  validationScore?: number | null;
  createdAt: Date | string;
};

const VALIDATION_FALLBACK = {
  label: "Unknown",
  badge: "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
  dot: "bg-zinc-400",
  description: "Unrecognized validation status.",
} as const;

const TYPE_ICON: Record<ArtifactTypeValue, React.ComponentType<{ className?: string }>> = {
  file: FileText,
  json: FileJson,
  text: Type,
  url: Link2,
  report: ScrollText,
};

/**
 * A submitted deliverable. Shows the title, a type chip, a validation status
 * badge, an optional score gauge, a truncated content preview and/or an
 * external link. Server component.
 */
export function ArtifactCard({
  artifact,
  className,
}: {
  artifact: ArtifactLike;
  className?: string;
}) {
  const meta =
    VALIDATION_STATUS_META[artifact.validationStatus as ValidationStatusValue] ??
    VALIDATION_FALLBACK;
  const TypeIcon = TYPE_ICON[artifact.type as ArtifactTypeValue] ?? FileText;
  const hasScore =
    typeof artifact.validationScore === "number" &&
    !Number.isNaN(artifact.validationScore);
  const hasContent = Boolean(artifact.content?.trim());

  return (
    <div
      className={cn(
        "group/artifact flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/20",
        className,
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
            <TypeIcon className="size-4.5" />
          </span>
          <div className="min-w-0">
            <h4 className="truncate text-sm font-medium text-foreground">
              {artifact.title}
            </h4>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center rounded-md border border-border bg-muted/30 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {artifact.type}
              </span>
              <RelativeTime
                date={artifact.createdAt}
                className="text-xs text-muted-foreground"
              />
            </div>
          </div>
        </div>

        {hasScore ? (
          <ScoreGauge
            score={artifact.validationScore as number}
            status={artifact.validationStatus}
          />
        ) : null}
      </div>

      {/* Validation status badge */}
      <div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
            meta.badge,
          )}
          title={meta.description}
        >
          <span className={cn("size-1.5 rounded-full", meta.dot)} aria-hidden />
          Validation {meta.label.toLowerCase()}
        </span>
      </div>

      {/* Content preview */}
      {hasContent && (
        <p className="rounded-lg border border-border bg-muted/20 p-3 font-mono text-xs leading-relaxed text-muted-foreground">
          {truncate(artifact.content as string, 240)}
        </p>
      )}

      {/* URL link */}
      {artifact.url && (
        <Link
          href={artifact.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "w-fit",
          )}
        >
          <ExternalLink className="size-3.5" />
          Open artifact
          <span className="sr-only"> (opens in a new tab)</span>
        </Link>
      )}
    </div>
  );
}

/**
 * Compact circular gauge for a 0–100 validation score, tinted by pass/fail
 * against the shared threshold.
 */
function ScoreGauge({ score, status }: { score: number; status: string }) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const passed =
    status === "passed" ||
    (status !== "failed" && clamped >= VALIDATION_PASS_THRESHOLD);
  const stroke = passed ? "stroke-success" : "stroke-destructive";
  const text = passed ? "text-success" : "text-destructive";

  return (
    <div className="relative size-11 shrink-0" title={`Validation score ${clamped}/100`}>
      <svg viewBox="0 0 36 36" className="size-full -rotate-90">
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          className="stroke-muted"
          strokeWidth="3"
        />
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          className={stroke}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center text-xs font-semibold tabular-nums",
          text,
        )}
      >
        {Math.round(clamped)}
      </span>
    </div>
  );
}
