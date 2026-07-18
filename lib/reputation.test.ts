import { describe, it, expect } from "vitest";

import {
  computeStatsUpdate,
  REPUTATION_DELTAS,
  type AgentStats,
} from "@/lib/reputation";

const baseline: AgentStats = {
  totalTasksCompleted: 100,
  completionRate: 96,
  disputeRate: 2,
  averageRating: 4.6,
};

describe("computeStatsUpdate — task_completed", () => {
  it("increments the task count and nudges completion toward 100", () => {
    const update = computeStatsUpdate(baseline, { kind: "task_completed" });
    expect(update.totalTasksCompleted).toBe(101);
    // (96*100 + 100) / 101 = 96.04 → rounds to 96.0
    expect(update.completionRate).toBe(96);
    expect(update.completionRate!).toBeGreaterThan(baseline.completionRate - 0.1);
    // It only touches completion-related fields.
    expect(update.averageRating).toBeUndefined();
    expect(update.disputeRate).toBeUndefined();
  });

  it("moves a brand-new agent far more than an established one", () => {
    const fresh: AgentStats = { ...baseline, totalTasksCompleted: 0, completionRate: 0 };
    const freshDelta = computeStatsUpdate(fresh, { kind: "task_completed" }).completionRate!;
    const veteran: AgentStats = { ...baseline, totalTasksCompleted: 400, completionRate: 0 };
    const veteranDelta = computeStatsUpdate(veteran, { kind: "task_completed" }).completionRate!;
    // history weights the blend: the same 0 → toward-100 move is larger for the newcomer.
    expect(freshDelta).toBeGreaterThan(veteranDelta);
  });
});

describe("computeStatsUpdate — dispute_opened", () => {
  it("nudges completion down and dispute rate up", () => {
    const update = computeStatsUpdate(baseline, { kind: "dispute_opened" });
    expect(update.completionRate!).toBeLessThanOrEqual(baseline.completionRate);
    expect(update.disputeRate!).toBeGreaterThan(baseline.disputeRate);
    expect(update.totalTasksCompleted).toBeUndefined();
    expect(update.averageRating).toBeUndefined();
  });
});

describe("computeStatsUpdate — review_added", () => {
  // A modest history so a single review visibly moves the rounded average.
  const newish: AgentStats = { ...baseline, totalTasksCompleted: 4, averageRating: 4.0 };

  it("pulls the running average toward a higher rating", () => {
    const update = computeStatsUpdate(newish, { kind: "review_added", rating: 5 });
    expect(update.averageRating!).toBeGreaterThan(newish.averageRating);
    expect(update.averageRating!).toBeLessThanOrEqual(5);
  });

  it("pulls the running average toward a lower rating", () => {
    const update = computeStatsUpdate(newish, { kind: "review_added", rating: 1 });
    expect(update.averageRating!).toBeLessThan(newish.averageRating);
  });

  it("barely moves an established average (history dampens single reviews)", () => {
    // 100 prior reviews: one 1★ review stays inside the same 0.1 bucket (4.6).
    const update = computeStatsUpdate(baseline, { kind: "review_added", rating: 1 });
    expect(update.averageRating).toBe(4.6);
  });

  it("is deterministic and rounded to one decimal", () => {
    const a = computeStatsUpdate(newish, { kind: "review_added", rating: 3 });
    const b = computeStatsUpdate(newish, { kind: "review_added", rating: 3 });
    expect(a).toEqual(b);
    expect(a.averageRating).toBe(Math.round(a.averageRating! * 10) / 10);
  });
});

describe("REPUTATION_DELTAS", () => {
  it("rewards good outcomes and penalizes bad ones", () => {
    expect(REPUTATION_DELTAS.taskCompleted).toBeGreaterThan(0);
    expect(REPUTATION_DELTAS.disputeResolved).toBeGreaterThan(0);
    expect(REPUTATION_DELTAS.agentVerified).toBeGreaterThan(0);
    expect(REPUTATION_DELTAS.disputeOpened).toBeLessThan(0);
    expect(REPUTATION_DELTAS.validationFailed).toBeLessThan(0);
  });

  it("maps reviews so 5★ is a gain and 1★ is a loss (reviewBase + rating)", () => {
    expect(REPUTATION_DELTAS.reviewBase + 5).toBe(3);
    expect(REPUTATION_DELTAS.reviewBase + 1).toBe(-1);
  });
});
