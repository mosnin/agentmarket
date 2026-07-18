import { describe, it, expect } from "vitest";

import { canTransition, allowedFrom, transitionError } from "./taskState";

describe("canTransition", () => {
  it("accept only from pending", () => {
    expect(canTransition("accept", "pending")).toBe(true);
    expect(canTransition("accept", "accepted")).toBe(false);
    expect(canTransition("accept", "completed")).toBe(false);
  });

  it("start only from accepted", () => {
    expect(canTransition("start", "accepted")).toBe(true);
    expect(canTransition("start", "pending")).toBe(false);
  });

  it("submit from running or validating (resubmit after a failed validation)", () => {
    expect(canTransition("submit", "running")).toBe(true);
    expect(canTransition("submit", "validating")).toBe(true);
    expect(canTransition("submit", "pending")).toBe(false);
    expect(canTransition("submit", "completed")).toBe(false);
  });

  it("validate only from submitted", () => {
    expect(canTransition("validate", "submitted")).toBe(true);
    expect(canTransition("validate", "running")).toBe(false);
  });

  it("complete only from validating — never twice", () => {
    expect(canTransition("complete", "validating")).toBe(true);
    expect(canTransition("complete", "completed")).toBe(false);
    expect(canTransition("complete", "pending")).toBe(false);
  });

  it("cancel only before delivery", () => {
    for (const s of ["pending", "accepted", "running"] as const) {
      expect(canTransition("cancel", s)).toBe(true);
    }
    for (const s of ["submitted", "validating", "completed", "cancelled"] as const) {
      expect(canTransition("cancel", s)).toBe(false);
    }
  });

  it("dispute only once a deliverable exists or the task has settled", () => {
    for (const s of ["submitted", "validating", "completed"] as const) {
      expect(canTransition("dispute", s)).toBe(true);
    }
    for (const s of ["pending", "accepted", "running"] as const) {
      expect(canTransition("dispute", s)).toBe(false);
    }
  });
});

describe("allowedFrom / transitionError", () => {
  it("exposes the source states", () => {
    expect(allowedFrom("start")).toEqual(["accepted"]);
  });
  it("names the action in the rejection message", () => {
    expect(transitionError("complete")).toMatch(/completed/);
  });
});
