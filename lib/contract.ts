/**
 * Deterministic "AI-assisted" task structuring (MOCK).
 *
 * Turns a freeform objective into a structured contract preview using a local,
 * deterministic transform — no model call. Swap `buildStructuredContract` for a
 * real LLM structuring call later; the return shape is the integration point.
 */

export interface StructuredContract {
  title: string;
  objective: string;
  category: string;
  steps: string[];
  inputs: { name: string; type: string; required: boolean }[];
  outputSchema: Record<string, string>;
  successCriteria: string[];
  suggestedBudget: number;
}

const CATEGORY_OUTPUT: Record<string, Record<string, string>> = {
  Growth: { company: "string", domain: "string", contact_email: "string", confidence: "number" },
  Research: { summary: "string", sources: "string[]", citations: "string[]", confidence: "number" },
  Coding: { findings: "string[]", severity: "string", patch: "string", tests_added: "number" },
  Data: { rows_processed: "number", duplicates_removed: "number", schema: "object", report_url: "string" },
  Design: { score: "number", issues: "string[]", recommendations: "string[]" },
  Operations: { records_updated: "number", routed: "number", status: "string" },
  Finance: { categories: "object", total: "number", variance: "number", report_url: "string" },
  Security: { vulnerabilities: "string[]", severity: "string", remediation: "string[]" },
  "Customer Support": { ticket_id: "string", category: "string", draft_reply: "string", sentiment: "string" },
  Infrastructure: { uptime: "number", incidents: "string[]", summary: "string" },
};

function toTitle(objective: string): string {
  const cleaned = objective.trim().replace(/\s+/g, " ");
  const firstClause = cleaned.split(/[.!?\n]/)[0] ?? cleaned;
  const words = firstClause.split(" ").slice(0, 9).join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function buildStructuredContract(params: {
  objective: string;
  category?: string;
  budget?: number;
}): StructuredContract {
  const category = params.category ?? "Research";
  const objective = params.objective.trim();
  const outputSchema = CATEGORY_OUTPUT[category] ?? {
    result: "string",
    confidence: "number",
  };

  const steps = [
    `Parse the objective and confirm scope for "${toTitle(objective)}".`,
    `Gather required inputs and validate against the ${category.toLowerCase()} contract.`,
    "Execute the core task and produce a structured artifact.",
    "Self-validate the output against the declared schema and success criteria.",
    "Submit the artifact and emit a completion receipt.",
  ];

  return {
    title: toTitle(objective) || "Structured task",
    objective,
    category,
    steps,
    inputs: [
      { name: "objective", type: "string", required: true },
      { name: "context", type: "string", required: false },
      { name: "data_url", type: "string", required: false },
    ],
    outputSchema,
    successCriteria: [
      "Output conforms to the declared output schema.",
      "All required fields are present and non-empty.",
      "Validation score is at or above the marketplace threshold (80).",
    ],
    suggestedBudget: params.budget && params.budget > 0 ? params.budget : 25,
  };
}
