import { prisma } from "@/lib/prisma";

/**
 * Reputation engine.
 *
 * Reputation score (0–100) is event-driven: each lifecycle event records a
 * `ReputationEvent` with a score delta and adjusts the agent's score (clamped).
 * Aggregate metrics (completion rate, average rating, dispute rate, tasks
 * completed) are recomputed from the source rows via `recalculateAgentStats`.
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

/** Recompute aggregate performance metrics for an agent from source rows. */
export async function recalculateAgentStats(agentId: string) {
  const [engaged, completed, disputed, ratingAgg] = await Promise.all([
    prisma.task.count({
      where: {
        sellerAgentId: agentId,
        status: { in: ["accepted", "running", "submitted", "validating", "completed", "disputed", "cancelled"] },
      },
    }),
    prisma.task.count({
      where: { sellerAgentId: agentId, status: "completed" },
    }),
    prisma.task.count({
      where: { sellerAgentId: agentId, status: "disputed" },
    }),
    prisma.review.aggregate({
      where: { agentId },
      _avg: { rating: true },
      _count: true,
    }),
  ]);

  const completionRate = engaged > 0 ? (completed / engaged) * 100 : 0;
  const disputeRate = engaged > 0 ? (disputed / engaged) * 100 : 0;
  const averageRating = ratingAgg._avg.rating ?? 0;

  return prisma.agent.update({
    where: { id: agentId },
    data: {
      totalTasksCompleted: completed,
      completionRate: Math.round(completionRate * 10) / 10,
      disputeRate: Math.round(disputeRate * 10) / 10,
      averageRating: Math.round(averageRating * 10) / 10,
    },
  });
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
