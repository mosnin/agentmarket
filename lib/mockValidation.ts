import { hashString } from "@/lib/utils";
import { VALIDATION_PASS_THRESHOLD } from "@/lib/constants";

/**
 * Deterministic mock validation engine.
 *
 * Real systems would run the artifact against the contract's output schema and
 * success criteria. Here we derive a stable score (70–99) from the artifact +
 * task identity so results are reproducible. Replace `runMockValidation` with a
 * real validator (JSON schema diff, eval harness, LLM judge) later.
 */

export interface ValidationCheck {
  label: string;
  passed: boolean;
  detail: string;
}

export interface ValidationResult {
  score: number;
  passed: boolean;
  status: "passed" | "failed";
  checks: ValidationCheck[];
  summary: string;
}

export interface ValidationInput {
  artifactId: string;
  taskId: string;
  hasArtifact: boolean;
  hasContent: boolean;
  hasOutputSchema: boolean;
}

/** Stable score in the inclusive range [70, 99]. */
export function computeValidationScore(seed: string): number {
  return 70 + (hashString(seed) % 30);
}

export function runMockValidation(input: ValidationInput): ValidationResult {
  const checks: ValidationCheck[] = [];

  // 1. Artifact must exist.
  checks.push({
    label: "Artifact present",
    passed: input.hasArtifact,
    detail: input.hasArtifact
      ? "A deliverable artifact was submitted."
      : "No artifact has been submitted for this task.",
  });

  if (!input.hasArtifact) {
    return {
      score: 0,
      passed: false,
      status: "failed",
      checks,
      summary: "Validation failed: no artifact to validate.",
    };
  }

  // 2. Output schema present on the contract.
  checks.push({
    label: "Output schema defined",
    passed: input.hasOutputSchema,
    detail: input.hasOutputSchema
      ? "Contract declares an output schema to validate against."
      : "No output schema on the contract — validating against success criteria only.",
  });

  // 3. Payload / content present.
  checks.push({
    label: "Deliverable content",
    passed: input.hasContent,
    detail: input.hasContent
      ? "Artifact includes inline content or a reachable URL."
      : "Artifact has no inline content; relying on linked URL.",
  });

  const score = computeValidationScore(`${input.taskId}:${input.artifactId}`);
  const passed = score >= VALIDATION_PASS_THRESHOLD;

  checks.push({
    label: "Schema compliance score",
    passed,
    detail: `Computed compliance score of ${score} (threshold ${VALIDATION_PASS_THRESHOLD}).`,
  });

  return {
    score,
    passed,
    status: passed ? "passed" : "failed",
    checks,
    summary: passed
      ? `Validation passed with a score of ${score}.`
      : `Validation scored ${score}, below the ${VALIDATION_PASS_THRESHOLD} threshold.`,
  };
}
