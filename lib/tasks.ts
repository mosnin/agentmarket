import type { TaskStatusValue } from "@/lib/constants";

/**
 * Client-safe task helpers (no Prisma import), so server pages and client
 * components share the same lifecycle logic.
 */

/** Terminal task states — no further lifecycle actions, never "overdue". */
const TERMINAL_TASK_STATUSES = new Set<string>(["completed", "cancelled"]);

/**
 * States in which a task may be reviewed: only once the agent has actually
 * delivered work (submission onward), through settlement or dispute. A review on
 * a `draft`/`pending`/`accepted`/`running`/`cancelled` task would rate work that
 * doesn't exist, so the review action rejects those. Pure so it's shared by the
 * server action and unit-tested without a database.
 */
const REVIEWABLE_TASK_STATUSES = new Set<string>([
  "submitted",
  "validating",
  "completed",
  "disputed",
]);

export function isTaskReviewable(status: TaskStatusValue | string): boolean {
  return REVIEWABLE_TASK_STATUSES.has(status);
}

/**
 * A task is overdue when it has a deadline in the past **and** is still in flight
 * (not completed or cancelled). Pure + deterministic — pass `now` in tests — so the
 * detail page and the dashboard lists flag a blown deadline identically.
 */
export function isTaskOverdue(
  deadline: Date | string | null | undefined,
  status: TaskStatusValue | string,
  now: number = Date.now(),
): boolean {
  if (!deadline || TERMINAL_TASK_STATUSES.has(status)) return false;
  const time = new Date(deadline).getTime();
  return Number.isFinite(time) && time < now;
}

/** How far ahead counts as "due soon" — the next 24 hours. */
const DUE_SOON_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * A task is "due soon" when its deadline falls within the next 24 hours, it isn't
 * already overdue, and it's still in flight — a proactive nudge before the
 * deadline is blown. Mutually exclusive with `isTaskOverdue`. Pure + deterministic
 * (pass `now` in tests).
 */
export function isTaskDueSoon(
  deadline: Date | string | null | undefined,
  status: TaskStatusValue | string,
  now: number = Date.now(),
): boolean {
  if (!deadline || TERMINAL_TASK_STATUSES.has(status)) return false;
  const time = new Date(deadline).getTime();
  if (!Number.isFinite(time)) return false;
  return time >= now && time <= now + DUE_SOON_WINDOW_MS;
}

/**
 * Sort key for an operator's glance list: overdue (0) before due-soon (1) before
 * everything else (2). Pair with a stable sort so recency order is preserved
 * within each band.
 */
export function taskUrgencyRank(
  task: {
    deadline: Date | string | null | undefined;
    status: TaskStatusValue | string;
  },
  now: number = Date.now(),
): number {
  if (isTaskOverdue(task.deadline, task.status, now)) return 0;
  if (isTaskDueSoon(task.deadline, task.status, now)) return 1;
  return 2;
}
