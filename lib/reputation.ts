import { prisma } from "@/lib/prisma";

/**
 * Reputation engine.
 *
 * Reputation score (0–100) is event-driven: each lifecycle event records a
 * `ReputationEvent` with a score delta and adjusts the agent's score (clamped).
 * Aggregate metrics (completion rate, average rating, dispute rate, tasks
 * completed) are maintained by `recalculateAgentStats`, which blends each
 * lifecycle event onto the agent's established (seeded) baseline rather than
 * recomputing absolute values from the sparse task table — so curated "feels
 * alive" numbers degrade gracefully instead of collapsing on the first action.
 */

export type ReputationEventType =
  | "task_completed"
  | "review_received"
  | "dispute_opened"
  | "dispute_resolved"
  | "validation_passed"
  | "validation_failed"
  | "agent_verified"
  | "manual_adjustment";

const clamp = (value: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, value));

export async function recordReputationEvent(input: {
  agentId: string;
  taskId?: string | null;
  type: ReputationEventType;
  scoreDelta: number;
  reason: string;
}) {
  const agent = await prisma.agent.findUnique({
    where: { id: input.agentId },
    select: { reputationScore: true },
  });
  if (!agent) return null;

  const nextScore = clamp(Math.round(agent.reputationScore + input.scoreDelta));

  const [event] = await prisma.$transaction([
    prisma.reputationEvent.create({
      data: {
        agentId: input.agentId,
        taskId: input.taskId ?? null,
        type: input.type,
        scoreDelta: input.scoreDelta,
        reason: input.reason,
      },
    }),
    prisma.agent.update({
      where: { id: input.agentId },
      data: { reputationScore: nextScore },
    }),
  ]);

  return event;
}

/**
 * Lifecycle events that adjust an agent's aggregate performance metrics.
 *  - `task_completed`: a delivered task was accepted by the buyer.
 *  - `dispute_opened`: a deliverable was disputed.
 *  - `review_added`: a buyer left/updated a review (rating is supplied).
 */
export type AgentStatsEvent =
  | { kind: "task_completed" }
  | { kind: "dispute_opened" }
  | { kind: "review_added"; rating: number };

const round1 = (value: number) => Math.round(value * 10) / 10;

/** An agent's aggregate performance metrics — the inputs to the blend math. */
export interface AgentStats {
  totalTasksCompleted: number;
  completionRate: number;
  disputeRate: number;
  averageRating: number;
}

/** The subset of metrics a single lifecycle event changes. */
export type AgentStatsUpdate = Partial<AgentStats>;

/**
 * Pure blend math: given an agent's current aggregate metrics and a single
 * lifecycle event, return the fields to update. No DB access — the async
 * `recalculateAgentStats` wrapper fetches the agent and persists the result, so
 * this core logic stays unit-testable.
 *
 * The seed (prisma/seed.ts) deliberately writes curated baseline metrics so the
 * marketplace feels alive (e.g. 412 tasks, 98.2% completion, 4.9★). Those stored
 * values represent the agent's established history, so we treat them as a baseline
 * and layer live deltas on top — rather than recomputing absolutes from the ~10
 * seeded Task/Review rows, which would collapse a 400-task history to whatever the
 * sparse table holds. The rate/rating metrics use a weighted blend keyed on the
 * established task count, so a single new data point can't swing a large history
 * (spec §11: "increase totalTasksCompleted; recalculate completionRate; update
 * averageRating if a review exists").
 */
export function computeStatsUpdate(
  current: AgentStats,
  event: AgentStatsEvent,
): AgentStatsUpdate {
  // The established history acts as the weight: a single new observation moves a
  // 400-task average by ~0.25%, but meaningfully shifts a brand-new agent.
  const history = Math.max(current.totalTasksCompleted, 1);
  const data: AgentStatsUpdate = {};

  if (event.kind === "task_completed") {
    // A successful delivery: increment the count and nudge completion toward 100%.
    data.totalTasksCompleted = current.totalTasksCompleted + 1;
    data.completionRate = round1((current.completionRate * history + 100) / (history + 1));
  }

  if (event.kind === "dispute_opened") {
    // A dispute is one negative engagement: nudge completion down, dispute up.
    data.completionRate = round1((current.completionRate * history) / (history + 1));
    data.disputeRate = round1((current.disputeRate * history + 100) / (history + 1));
  }

  if (event.kind === "review_added") {
    // Pull the running average toward the new rating, weighted by prior review
    // volume (approximated from task history, capped so recent feedback still
    // registers).
    const priorReviews = Math.min(history, 200);
    data.averageRating = round1(
      (current.averageRating * priorReviews + event.rating) / (priorReviews + 1),
    );
  }

  return data;
}

/**
 * Apply a lifecycle event to an agent's stored aggregate metrics.
 *
 * Re-running `npm run db:seed` resets the baseline; this blend keeps the curated
 * numbers intact as lifecycle actions accumulate against them.
 */
export async function recalculateAgentStats(agentId: string, event: AgentStatsEvent) {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: {
      totalTasksCompleted: true,
      completionRate: true,
      disputeRate: true,
      averageRating: true,
    },
  });
  if (!agent) return null;

  const data = computeStatsUpdate(agent, event);
  return prisma.agent.update({ where: { id: agentId }, data });
}

/** Score deltas for each lifecycle event (single source of truth). */
export const REPUTATION_DELTAS = {
  taskCompleted: 2,
  validationPassed: 1,
  validationFailed: -1,
  disputeOpened: -5,
  disputeResolved: 3,
  reviewBase: -2, // combined with rating: delta = reviewBase + rating (so 5★ = +3, 1★ = -1)
  agentVerified: 4,
} as const;
