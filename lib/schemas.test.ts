import { describe, it, expect } from "vitest";

import {
  createAgentSchema,
  createTaskSchema,
  reviewSchema,
  apiCreateTaskSchema,
} from "@/lib/schemas";
import {
  CATEGORIES,
  PRICING_MODELS,
  OUTPUT_FORMATS,
  PAYMENT_MODES,
  VISIBILITY_OPTIONS,
} from "@/lib/constants";

// Pull real enum values so the tests can't drift from the source vocabulary.
const category = CATEGORIES[0];
const pricingModel = PRICING_MODELS[0];
const outputFormat = OUTPUT_FORMATS[0];
const paymentMode = PAYMENT_MODES[0];
const visibility = VISIBILITY_OPTIONS[0];

const validAgent = {
  name: "Atlas Researcher",
  shortDescription: "Citation-grade research briefs on demand.",
  longDescription: "Gathers sources, synthesizes findings and ships a brief.",
  category,
  capabilities: ["research", "synthesis"],
  pricingModel,
  startingPrice: 25,
};

describe("createAgentSchema", () => {
  it("accepts a well-formed listing", () => {
    expect(createAgentSchema.safeParse(validAgent).success).toBe(true);
  });
  it("rejects a one-character name", () => {
    expect(
      createAgentSchema.safeParse({ ...validAgent, name: "A" }).success,
    ).toBe(false);
  });
  it("requires at least one capability", () => {
    expect(
      createAgentSchema.safeParse({ ...validAgent, capabilities: [] }).success,
    ).toBe(false);
  });
  it("rejects an unknown category", () => {
    expect(
      createAgentSchema.safeParse({ ...validAgent, category: "Nonsense" })
        .success,
    ).toBe(false);
  });
  it("coerces a numeric string price", () => {
    const result = createAgentSchema.safeParse({
      ...validAgent,
      startingPrice: "40",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.startingPrice).toBe(40);
  });
});

const validTask = {
  title: "Summarize Q3 competitors",
  objective: "Produce a one-page brief on the top three competitors.",
  category,
  sellerAgentId: "agent_123",
  outputFormat,
  budget: 50,
  paymentMode,
  visibility,
};

describe("createTaskSchema", () => {
  it("accepts a well-formed task", () => {
    expect(createTaskSchema.safeParse(validTask).success).toBe(true);
  });
  it("rejects a too-short title", () => {
    expect(
      createTaskSchema.safeParse({ ...validTask, title: "ab" }).success,
    ).toBe(false);
  });
  it("requires a target agent", () => {
    expect(
      createTaskSchema.safeParse({ ...validTask, sellerAgentId: "" }).success,
    ).toBe(false);
  });
});

describe("reviewSchema", () => {
  it("accepts a rating within 1–5", () => {
    expect(reviewSchema.safeParse({ rating: 3 }).success).toBe(true);
  });
  it("rejects a rating above 5", () => {
    expect(reviewSchema.safeParse({ rating: 6 }).success).toBe(false);
  });
  it("rejects a rating below 1", () => {
    expect(reviewSchema.safeParse({ rating: 0 }).success).toBe(false);
  });
  it("coerces a numeric string rating", () => {
    const result = reviewSchema.safeParse({ rating: "4" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.rating).toBe(4);
  });
});

describe("apiCreateTaskSchema", () => {
  it("accepts objective + positive budget", () => {
    expect(
      apiCreateTaskSchema.safeParse({ objective: "Do the thing well", budget: 25 })
        .success,
    ).toBe(true);
  });
  it("rejects a zero budget", () => {
    expect(
      apiCreateTaskSchema.safeParse({ objective: "Do the thing well", budget: 0 })
        .success,
    ).toBe(false);
  });
  it("requires an objective", () => {
    expect(apiCreateTaskSchema.safeParse({ budget: 25 }).success).toBe(false);
  });
  it("accepts snake_case seller_agent_id", () => {
    expect(
      apiCreateTaskSchema.safeParse({
        objective: "Do the thing well",
        budget: 25,
        seller_agent_id: "agent_123",
      }).success,
    ).toBe(true);
  });
});
