import type { TaskStatus } from "@prisma/client";

/**
 * The task lifecycle modeled as an explicit state machine.
 *
 * Each action may only fire from an allowed source state. The actions layer
 * enforces this *atomically* via
 *   `updateMany({ where: { id, status: { in: allowedFrom } }, data: { status: to } })`
 * and treats a `count` of 0 as an illegal transition — so concurrent or replayed
 * calls can never double-apply a side effect (e.g. release a payment twice).
 *
 * Pure + DB-free so the policy is exhaustively unit-tested.
 */

export type TaskAction =
  | "accept"
  | "start"
  | "submit"
  | "validate"
  | "complete"
  | "cancel"
  | "dispute";

export const TASK_TRANSITIONS = {
  accept: { from: ["pending"], to: "accepted", verb: "accepted" },
  start: { from: ["accepted"], to: "running", verb: "started" },
  // running -> submitted (first delivery) and validating -> submitted (resubmit
  // after a failed validation).
  submit: { from: ["running", "validating"], to: "submitted", verb: "submitted" },
  validate: { from: ["submitted"], to: "validating", verb: "sent for validation" },
  complete: { from: ["validating"], to: "completed", verb: "completed" },
  cancel: { from: ["pending", "accepted", "running"], to: "cancelled", verb: "cancelled" },
  dispute: { from: ["submitted", "validating", "completed"], to: "disputed", verb: "disputed" },
} as const satisfies Record<
  TaskAction,
  { from: readonly TaskStatus[]; to: TaskStatus; verb: string }
>;

/** Source states from which `action` may legally fire. */
export function allowedFrom(action: TaskAction): readonly TaskStatus[] {
  return TASK_TRANSITIONS[action].from;
}

/** Whether `action` is legal from the `current` state. */
export function canTransition(action: TaskAction, current: TaskStatus): boolean {
  return (TASK_TRANSITIONS[action].from as readonly TaskStatus[]).includes(current);
}

/** Human-readable rejection used when a transition isn't allowed. */
export function transitionError(action: TaskAction): string {
  return `This task can't be ${TASK_TRANSITIONS[action].verb} from its current state.`;
}
