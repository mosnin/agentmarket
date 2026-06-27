import type { TaskStatusValue } from "@/lib/constants";

/**
 * Client-safe task helpers (no Prisma import), so server pages and client
 * components share the same lifecycle logic.
 */

/** Terminal task states — no further lifecycle actions, never "overdue". */
const TERMINAL_TASK_STATUSES = new Set<string>(["completed", "cancelled"]);

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
