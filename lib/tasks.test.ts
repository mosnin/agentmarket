import { describe, it, expect } from "vitest";

import { isTaskOverdue, isTaskDueSoon } from "@/lib/tasks";

const NOW = new Date("2026-06-27T12:00:00Z").getTime();
const PAST = "2026-06-20T12:00:00Z";
const FUTURE = "2026-07-04T12:00:00Z";
const SOON = "2026-06-27T18:00:00Z"; // 6h ahead — within the 24h window

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
