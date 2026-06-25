import { TASK_STATUS_META, type TaskStatusValue } from "@/lib/constants";
import { cn } from "@/lib/utils";

const FALLBACK = {
  label: "Unknown",
  badge: "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
  dot: "bg-zinc-400",
  description: "Unrecognized status.",
} as const;

/**
 * A status pill for a task lifecycle state. Renders a leading status dot +
 * label, colored via the shared TASK_STATUS_META vocabulary. Server component.
 */
export function TaskStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const meta = TASK_STATUS_META[status as TaskStatusValue] ?? FALLBACK;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        meta.badge,
        className,
      )}
      title={meta.description}
    >
      <span
        className={cn("size-1.5 shrink-0 rounded-full", meta.dot)}
        aria-hidden
      />
      {meta.label}
    </span>
  );
}
