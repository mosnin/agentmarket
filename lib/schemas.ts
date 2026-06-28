import { z } from "zod";
import {
  CATEGORIES,
  PRICING_MODELS,
  PAYMENT_MODES,
  VISIBILITY_OPTIONS,
  ARTIFACT_TYPES,
  OUTPUT_FORMATS,
} from "@/lib/constants";
import { isSafePublicUrl } from "@/lib/url";

/**
 * Zod schemas — the single source of truth for form + API validation.
 * Client-safe: this module never imports the Prisma client.
 */

const optionalUrl = z
  .string()
  .trim()
  .refine(
    (v) => v === "" || isSafePublicUrl(v),
    "Enter a public http(s) URL (private or loopback hosts aren't allowed)",
  )
  .optional();

const jsonObjectString = z
  .string()
  .trim()
  .refine((v) => {
    if (!v) return true;
    try {
      const parsed = JSON.parse(v);
      return typeof parsed === "object" && parsed !== null;
    } catch {
      return false;
    }
  }, "Must be a valid JSON object")
  .optional();

export const createAgentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  shortDescription: z
    .string()
    .min(10, "Add a short description")
    .max(180, "Keep the tagline under 180 characters"),
  longDescription: z
    .string()
    .min(20, "Describe what this agent does")
    .max(6000),
  category: z.enum(CATEGORIES),
  capabilities: z
    .array(z.string().min(1))
    .min(1, "Add at least one capability")
    .max(16),
  pricingModel: z.enum(PRICING_MODELS),
  startingPrice: z.coerce
    .number()
    .min(0, "Price must be zero or more")
    .max(1_000_000),
  currency: z.string().default("USD"),
  endpointUrl: optionalUrl,
  mcpServerUrl: optionalUrl,
  inputSchema: jsonObjectString,
  outputSchema: jsonObjectString,
  organizationId: z.string().optional(),
  verified: z.boolean().default(false),
});
export type CreateAgentInput = z.infer<typeof createAgentSchema>;

export const createTaskSchema = z.object({
  title: z.string().min(3, "Add a clear title").max(140),
  objective: z.string().min(10, "Describe the objective").max(6000),
  category: z.enum(CATEGORIES),
  sellerAgentId: z.string().min(1, "Select a target agent"),
  inputInstructions: z.string().max(6000).optional(),
  inputDataUrl: optionalUrl,
  outputFormat: z.enum(OUTPUT_FORMATS),
  budget: z.coerce.number().min(0, "Budget must be zero or more").max(1_000_000),
  deadline: z.string().optional(),
  validationRules: z.string().max(4000).optional(),
  paymentMode: z.enum(PAYMENT_MODES),
  visibility: z.enum(VISIBILITY_OPTIONS),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const submitArtifactSchema = z.object({
  title: z.string().min(2, "Add a title").max(160),
  type: z.enum(ARTIFACT_TYPES),
  url: optionalUrl,
  content: z.string().max(40000).optional(),
});
export type SubmitArtifactInput = z.infer<typeof submitArtifactSchema>;

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Pick a rating").max(5),
  comment: z.string().max(2000).optional(),
});
export type ReviewInput = z.infer<typeof reviewSchema>;

export const disputeSchema = z.object({
  reason: z.string().min(10, "Explain the issue").max(2000),
});
export type DisputeInput = z.infer<typeof disputeSchema>;

/** Public API contract for POST /api/tasks. Accepts snake_case or camelCase. */
export const apiCreateTaskSchema = z.object({
  objective: z.string().min(5, "objective is required"),
  title: z.string().optional(),
  category: z.enum(CATEGORIES).optional(),
  seller_agent_id: z.string().optional(),
  sellerAgentId: z.string().optional(),
  budget: z.coerce.number().positive("budget is required and must be greater than 0"),
  output_schema: z.record(z.string(), z.any()).optional(),
  outputSchema: z.record(z.string(), z.any()).optional(),
  input_payload: z.record(z.string(), z.any()).optional(),
  input_data_url: z
    .string()
    .trim()
    .refine((v) => !v || isSafePublicUrl(v), "input_data_url must be a public http(s) URL")
    .optional(),
  payment_mode: z.enum(PAYMENT_MODES).optional(),
  paymentMode: z.enum(PAYMENT_MODES).optional(),
});
export type ApiCreateTaskInput = z.infer<typeof apiCreateTaskSchema>;

/** Safely parse a JSON string into an object, returning undefined on failure. */
export function parseJsonObject(
  value: string | null | undefined,
): Record<string, unknown> | undefined {
  if (!value || !value.trim()) return undefined;
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}
