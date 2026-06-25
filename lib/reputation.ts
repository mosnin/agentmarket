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

/**
 * Blend an agent's aggregate metrics in response to a single lifecycle event.
 *
 * The seed (lib/seed.ts) deliberately writes curated baseline metrics so the
 * marketplace feels alive (e.g. Growth Research Agent: 412 tasks, 98.2%
 * completion, 4.9★). Those stored values represent the agent's established
 * history, so we treat them as an immutable baseline and layer live deltas on
 * top — rather than recomputing absolute values from the ~10 seeded Task/Review
 * rows, which would collapse a 400-task history to whatever the sparse table
 * holds. `totalTasksCompleted` is incremented; the rate/rating metrics use a
 * weighted blend keyed on the established task count, so a single new data
 * point can't swing a large history (spec §11: "increase totalTasksCompleted;
 * recalculate completionRate; update averageRating if a review exists").
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

  // The established history acts as the weight: a single new observation moves
  // a 400-task average by ~0.25%, but meaningfully shifts a brand-new agent.
  const history = Math.max(agent.totalTasksCompleted, 1);

  const data: {
    totalTasksCompleted?: number;
    completionRate?: number;
    disputeRate?: number;
    averageRating?: number;
  } = {};

  if (event.kind === "task_completed") {
    // A successful delivery: increment the count and nudge completion rate
    // toward 100% (it never punishes for buyer-side cancellations because we no
    // longer count cancelled tasks in any denominator).
    data.totalTasksCompleted = agent.totalTasksCompleted + 1;
    const blendedCompletion = (agent.completionRate * history + 100) / (history + 1);
    data.completionRate = round1(blendedCompletion);
  }

  if (event.kind === "dispute_opened") {
    // A dispute counts as a single negative engagement: nudge completion rate
    // down slightly and dispute rate up slightly, weighted by history.
    const blendedCompletion = (agent.completionRate * history) / (history + 1);
    const blendedDispute = (agent.disputeRate * history + 100) / (history + 1);
    data.completionRate = round1(blendedCompletion);
    data.disputeRate = round1(blendedDispute);
  }

  if (event.kind === "review_added") {
    // Update the running average rating toward the new rating, weighted by the
    // (assumed) volume of prior reviews. We can't know the exact historical
    // review count from the sparse table, so we approximate it from the task
    // history, capped so the average still responds to recent feedback.
    const priorReviews = Math.min(history, 200);
    const blendedRating = (agent.averageRating * priorReviews + event.rating) / (priorReviews + 1);
    data.averageRating = round1(blendedRating);
  }

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
