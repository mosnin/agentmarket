import { describe, it, expect } from "vitest";

import { buildStructuredContract } from "@/lib/contract";

describe("buildStructuredContract", () => {
  it("is deterministic — same input yields an identical contract", () => {
    const params = { objective: "Find 50 SaaS leads in fintech", category: "Growth", budget: 120 };
    expect(buildStructuredContract(params)).toEqual(buildStructuredContract(params));
  });

  it("defaults the category to Research when none is given", () => {
    const contract = buildStructuredContract({ objective: "Summarize the latest papers" });
    expect(contract.category).toBe("Research");
    // Research output schema carries citation-grade fields.
    expect(Object.keys(contract.outputSchema)).toContain("citations");
  });

  it("picks a category-specific output schema", () => {
    const coding = buildStructuredContract({ objective: "Review this PR", category: "Coding" });
    expect(Object.keys(coding.outputSchema)).toEqual(
      expect.arrayContaining(["findings", "severity", "patch", "tests_added"]),
    );
  });

  it("falls back to a generic schema for an unknown category", () => {
    const contract = buildStructuredContract({ objective: "Do a thing", category: "Nonsense" });
    expect(contract.outputSchema).toEqual({ result: "string", confidence: "number" });
  });

  it("derives a title: trimmed, capitalized, first clause, max 9 words", () => {
    const contract = buildStructuredContract({
      objective: "  build a   detailed weekly competitor intelligence report for the team. Then email it.",
    });
    // First clause only (stops at the period), collapsed whitespace, capitalized,
    // capped at 9 words.
    expect(contract.title).toBe("Build a detailed weekly competitor intelligence report for the");
  });

  it("trims the objective it echoes back", () => {
    const contract = buildStructuredContract({ objective: "   research competitors   " });
    expect(contract.objective).toBe("research competitors");
  });

  it("uses the provided budget when positive, else defaults to 25", () => {
    expect(buildStructuredContract({ objective: "x task", budget: 200 }).suggestedBudget).toBe(200);
    expect(buildStructuredContract({ objective: "x task", budget: 0 }).suggestedBudget).toBe(25);
    expect(buildStructuredContract({ objective: "x task" }).suggestedBudget).toBe(25);
  });

  it("always emits the five-step execution plan and the standard inputs", () => {
    const contract = buildStructuredContract({ objective: "anything", category: "Data" });
    expect(contract.steps).toHaveLength(5);
    const required = contract.inputs.filter((i) => i.required).map((i) => i.name);
    expect(required).toEqual(["objective"]);
    expect(contract.successCriteria.length).toBeGreaterThan(0);
  });
});
