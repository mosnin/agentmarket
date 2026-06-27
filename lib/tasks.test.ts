import { describe, it, expect } from "vitest";

import { isTaskOverdue } from "@/lib/tasks";

const NOW = new Date("2026-06-27T12:00:00Z").getTime();
const PAST = "2026-06-20T12:00:00Z";
const FUTURE = "2026-07-04T12:00:00Z";

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
