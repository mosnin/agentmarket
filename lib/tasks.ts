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
