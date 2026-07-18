import { describe, it, expect } from "vitest";

import {
  computeValidationScore,
  runMockValidation,
  type ValidationInput,
} from "@/lib/mockValidation";
import { VALIDATION_PASS_THRESHOLD } from "@/lib/constants";

describe("computeValidationScore", () => {
  it("is deterministic for a given seed", () => {
    expect(computeValidationScore("task_1:artifact_1")).toBe(
      computeValidationScore("task_1:artifact_1"),
    );
  });

  it("always lands in the inclusive range [70, 99]", () => {
    for (let i = 0; i < 200; i++) {
      const score = computeValidationScore(`task_${i}:artifact_${i}`);
      expect(score).toBeGreaterThanOrEqual(70);
      expect(score).toBeLessThanOrEqual(99);
    }
  });

  it("varies across different seeds", () => {
    const scores = new Set(
      Array.from({ length: 100 }, (_, i) => computeValidationScore(`seed_${i}`)),
    );
    expect(scores.size).toBeGreaterThan(1);
  });
});

const baseInput: ValidationInput = {
  artifactId: "artifact_1",
  taskId: "task_1",
  hasArtifact: true,
  hasContent: true,
  hasOutputSchema: true,
};

describe("runMockValidation", () => {
  it("short-circuits to a hard fail when no artifact was submitted", () => {
    const result = runMockValidation({ ...baseInput, hasArtifact: false });
    expect(result.score).toBe(0);
    expect(result.passed).toBe(false);
    expect(result.status).toBe("failed");
    expect(result.checks).toHaveLength(1);
    expect(result.checks[0].passed).toBe(false);
  });

  it("is deterministic — identical input yields an identical result", () => {
    expect(runMockValidation(baseInput)).toEqual(runMockValidation(baseInput));
  });

  it("derives its score from the task:artifact seed", () => {
    const result = runMockValidation(baseInput);
    expect(result.score).toBe(
      computeValidationScore(`${baseInput.taskId}:${baseInput.artifactId}`),
    );
  });

  it("keeps status, passed and the threshold in agreement", () => {
    const result = runMockValidation(baseInput);
    expect(result.passed).toBe(result.score >= VALIDATION_PASS_THRESHOLD);
    expect(result.status).toBe(result.passed ? "passed" : "failed");
  });

  it("threshold actually bites — both pass and fail outcomes occur", () => {
    let sawPass = false;
    let sawFail = false;
    for (let i = 0; i < 300 && !(sawPass && sawFail); i++) {
      const result = runMockValidation({
        ...baseInput,
        artifactId: `artifact_${i}`,
        taskId: `task_${i}`,
      });
      if (result.passed) sawPass = true;
      else sawFail = true;
    }
    expect(sawPass).toBe(true);
    expect(sawFail).toBe(true);
  });
});
