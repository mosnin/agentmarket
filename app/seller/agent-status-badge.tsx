import { AGENT_STATUS_META, type AgentStatusValue } from "@/lib/constants";
import { cn } from "@/lib/utils";

const FALLBACK = {
  label: "Unknown",
  badge: "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
  dot: "bg-zinc-400",
  description: "Unrecognized agent status.",
} as const;

/**
 * Status pill for an agent listing (draft / active / suspended / archived),
 * colored via the shared AGENT_STATUS_META vocabulary. Mirrors the shape of the
 * shared task/payment status badges. Pure presentational — safe in both server
 * and client trees.
 */
export function AgentStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const meta = AGENT_STATUS_META[status as AgentStatusValue] ?? FALLBACK;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        meta.badge,
        className,
      )}
      title={meta.description}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", meta.dot)} aria-hidden />
      {meta.label}
    </span>
  );
}
