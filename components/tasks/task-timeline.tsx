import { Check, CircleSlash, Dot, TriangleAlert } from "lucide-react";

import {
  TASK_STATUS_FLOW,
  TASK_STATUS_META,
  type TaskStatusValue,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

type StepState = "done" | "active" | "upcoming" | "abandoned";

interface OffPath {
  /** terminal status that took the task off the happy path */
  status: Extract<TaskStatusValue, "disputed" | "cancelled">;
  /**
   * index in TASK_STATUS_FLOW that the task is assumed to have reached before
   * diverging. Steps at/below this index render as "done", the rest as
   * "abandoned".
   */
  divergedAfter: number;
}

/**
 * The lifecycle stepper for a task. Walks TASK_STATUS_FLOW (pending → accepted →
 * running → submitted → validating → completed) and marks each step done /
 * active / upcoming. For the off-path terminal states ("disputed", "cancelled")
 * it renders the flow up to the point of divergence and appends a clearly
 * separated terminal node. Server component — the "active" pulse is pure CSS.
 *
 * Defaults to a vertical layout that stays legible on every breakpoint.
 */
export function TaskTimeline({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const flow = TASK_STATUS_FLOW;
  const currentIndex = flow.indexOf(status as TaskStatusValue);

  // Determine off-path terminal behaviour.
  let offPath: OffPath | null = null;
  if (status === "disputed") {
    // Disputes are raised on a delivered artifact — assume submitted/validating
    // were reached before the buyer escalated.
    offPath = { status: "disputed", divergedAfter: flow.indexOf("validating") };
  } else if (status === "cancelled") {
    // Cancellations happen before delivery — keep the completed run short.
    offPath = { status: "cancelled", divergedAfter: flow.indexOf("accepted") };
  }

  const stepStateFor = (index: number): StepState => {
    if (offPath) {
      return index <= offPath.divergedAfter ? "done" : "abandoned";
    }
    if (status === "completed") return "done";
    if (currentIndex === -1) return "upcoming"; // unknown / draft
    if (index < currentIndex) return "done";
    if (index === currentIndex) return "active";
    return "upcoming";
  };

  const offPathMeta = offPath ? TASK_STATUS_META[offPath.status] : null;

  return (
    <ol className={cn("relative flex flex-col", className)}>
      {flow.map((step, index) => {
        const state = stepStateFor(index);
        const meta = TASK_STATUS_META[step];
        const isLast = index === flow.length - 1 && !offPath;

        return (
          <Step
            key={step}
            label={meta.label}
            description={meta.description}
            state={state}
            isLast={isLast}
            // connector tint: the segment leading INTO a done/active node is "lit"
            connectorActive={state === "done" || state === "active"}
          />
        );
      })}

      {offPath && offPathMeta && (
        <Step
          label={offPathMeta.label}
          description={offPathMeta.description}
          state="offpath"
          offPathStatus={offPath.status}
          isLast
          connectorActive={false}
        />
      )}
    </ol>
  );
}

function Step({
  label,
  description,
  state,
  isLast,
  connectorActive,
  offPathStatus,
}: {
  label: string;
  description: string;
  state: StepState | "offpath";
  isLast: boolean;
  connectorActive: boolean;
  offPathStatus?: "disputed" | "cancelled";
}) {
  const isDone = state === "done";
  const isActive = state === "active";
  const isAbandoned = state === "abandoned";
  const isOffPath = state === "offpath";

  return (
    <li className="relative flex gap-3 pb-6 last:pb-0">
      {/* Connector line (skipped on the last node) */}
      {!isLast && (
        <span
          aria-hidden
          className={cn(
            "absolute top-6 left-[11px] h-[calc(100%-1.5rem)] w-px",
            connectorActive ? "bg-brand/50" : "bg-border",
          )}
        />
      )}

      {/* Node marker */}
      <span
        aria-hidden
        className={cn(
          "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border text-[10px] transition-colors",
          isDone &&
            "border-brand/40 bg-brand/15 text-brand",
          isActive &&
            "border-brand bg-brand/20 text-brand shadow-[0_0_0_4px_color-mix(in_oklch,var(--brand)_18%,transparent)]",
          isAbandoned && "border-border bg-muted/40 text-muted-foreground/60",
          isOffPath &&
            offPathStatus === "disputed" &&
            "border-rose-500/40 bg-rose-500/15 text-rose-400",
          isOffPath &&
            offPathStatus === "cancelled" &&
            "border-zinc-500/40 bg-zinc-500/15 text-zinc-400",
          state === "upcoming" && "border-border bg-card text-muted-foreground",
        )}
      >
        {isDone && <Check className="size-3.5" strokeWidth={2.5} />}
        {isActive && (
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-brand" />
          </span>
        )}
        {state === "upcoming" && <Dot className="size-4" />}
        {isAbandoned && <Dot className="size-4 opacity-50" />}
        {isOffPath && offPathStatus === "disputed" && (
          <TriangleAlert className="size-3.5" />
        )}
        {isOffPath && offPathStatus === "cancelled" && (
          <CircleSlash className="size-3.5" />
        )}
      </span>

      {/* Label + description */}
      <div className="-mt-0.5 min-w-0 flex-1">
        <div
          className={cn(
            "flex items-center gap-2 text-sm font-medium leading-6",
            isDone && "text-foreground",
            isActive && "text-foreground",
            isAbandoned && "text-muted-foreground/60 line-through",
            isOffPath && offPathStatus === "disputed" && "text-rose-400",
            isOffPath && offPathStatus === "cancelled" && "text-muted-foreground",
            state === "upcoming" && "text-muted-foreground",
          )}
        >
          {label}
          {isActive && (
            <span className="rounded-full border border-brand/30 bg-brand/10 px-1.5 py-px text-[10px] font-medium text-brand">
              In progress
            </span>
          )}
        </div>
        <p
          className={cn(
            "mt-0.5 text-xs leading-snug",
            isActive || isOffPath
              ? "text-muted-foreground"
              : "text-muted-foreground/70",
            isAbandoned && "text-muted-foreground/50",
          )}
        >
          {description}
        </p>
      </div>
    </li>
  );
}
