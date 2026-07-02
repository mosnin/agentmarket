import { describe, it, expect } from "vitest";

import {
  isTaskOverdue,
  isTaskDueSoon,
  isTaskReviewable,
  taskUrgencyRank,
} from "@/lib/tasks";

const NOW = new Date("2026-06-27T12:00:00Z").getTime();
const PAST = "2026-06-20T12:00:00Z";
const FUTURE = "2026-07-04T12:00:00Z";
const SOON = "2026-06-27T18:00:00Z"; // 6h ahead — within the 24h window

describe("isTaskReviewable", () => {
  it("permits reviews only once the agent has delivered work", () => {
    for (const s of ["submitted", "validating", "completed", "disputed"]) {
      expect(isTaskReviewable(s)).toBe(true);
    }
  });
  it("blocks reviews on pre-delivery or cancelled tasks", () => {
    for (const s of ["draft", "pending", "accepted", "running", "cancelled"]) {
      expect(isTaskReviewable(s)).toBe(false);
    }
  });
});

describe("isTaskOverdue", () => {
  it("flags an in-flight task whose deadline has passed", () => {
    expect(isTaskOverdue(PAST, "running", NOW)).toBe(true);
    expect(isTaskOverdue(PAST, "pending", NOW)).toBe(true);
  });

  it("does not flag a task whose deadline is still in the future", () => {
    expect(isTaskOverdue(FUTURE, "running", NOW)).toBe(false);
  });

  it("never flags terminal tasks, even past their deadline", () => {
    expect(isTaskOverdue(PAST, "completed", NOW)).toBe(false);
    expect(isTaskOverdue(PAST, "cancelled", NOW)).toBe(false);
  });

  it("returns false when there is no deadline", () => {
    expect(isTaskOverdue(null, "running", NOW)).toBe(false);
    expect(isTaskOverdue(undefined, "running", NOW)).toBe(false);
    expect(isTaskOverdue("", "running", NOW)).toBe(false);
  });

  it("accepts a Date as well as an ISO string", () => {
    expect(isTaskOverdue(new Date(PAST), "running", NOW)).toBe(true);
    expect(isTaskOverdue(new Date(FUTURE), "running", NOW)).toBe(false);
  });

  it("ignores an unparseable deadline", () => {
    expect(isTaskOverdue("not-a-date", "running", NOW)).toBe(false);
  });
});

describe("isTaskDueSoon", () => {
  it("flags an in-flight task whose deadline is within the next 24h", () => {
    expect(isTaskDueSoon(SOON, "running", NOW)).toBe(true);
  });

  it("does not flag a deadline further than 24h out", () => {
    expect(isTaskDueSoon(FUTURE, "running", NOW)).toBe(false);
  });

  it("is mutually exclusive with overdue (past deadline → not due soon)", () => {
    expect(isTaskDueSoon(PAST, "running", NOW)).toBe(false);
    expect(isTaskOverdue(SOON, "running", NOW)).toBe(false);
  });

  it("never flags terminal tasks or a missing deadline", () => {
    expect(isTaskDueSoon(SOON, "completed", NOW)).toBe(false);
    expect(isTaskDueSoon(SOON, "cancelled", NOW)).toBe(false);
    expect(isTaskDueSoon(null, "running", NOW)).toBe(false);
  });
});

describe("taskUrgencyRank", () => {
  it("ranks overdue (0) before due-soon (1) before everything else (2)", () => {
    expect(taskUrgencyRank({ deadline: PAST, status: "running" }, NOW)).toBe(0);
    expect(taskUrgencyRank({ deadline: SOON, status: "running" }, NOW)).toBe(1);
    expect(taskUrgencyRank({ deadline: FUTURE, status: "running" }, NOW)).toBe(2);
  });

  it("ranks tasks with no deadline, and terminal tasks, as least urgent", () => {
    expect(taskUrgencyRank({ deadline: null, status: "running" }, NOW)).toBe(2);
    expect(taskUrgencyRank({ deadline: PAST, status: "completed" }, NOW)).toBe(2);
  });

  it("orders a mixed list overdue → due-soon → rest via a stable sort", () => {
    const tasks = [
      { id: "future", deadline: FUTURE, status: "running" },
      { id: "overdue", deadline: PAST, status: "running" },
      { id: "soon", deadline: SOON, status: "running" },
    ];
    const ordered = [...tasks]
      .sort((a, b) => taskUrgencyRank(a, NOW) - taskUrgencyRank(b, NOW))
      .map((t) => t.id);
    expect(ordered).toEqual(["overdue", "soon", "future"]);
  });
});
