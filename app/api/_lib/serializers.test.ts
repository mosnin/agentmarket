import { describe, it, expect } from "vitest";

import {
  serializeAgent,
  serializeTaskListItem,
  apiError,
} from "@/app/api/_lib/serializers";
import type { AgentCardData, TaskListItem } from "@/lib/data";

// The serializers read a known subset of fields; cast minimal fixtures so the
// tests pin the *output contract* without rebuilding the full Prisma payloads.
function makeAgent(overrides: Partial<Record<string, unknown>> = {}): AgentCardData {
  return {
    id: "a1",
    slug: "growth-research-agent",
    name: "Growth Research Agent",
    category: "Growth",
    shortDescription: "Finds and qualifies leads.",
    capabilities: [
      { capability: { name: "lead-gen" } },
      { capability: { name: "enrichment" } },
    ],
    pricingModel: "per_task",
    startingPrice: 25,
    currency: "USD",
    verified: true,
    reputationScore: 92,
    completionRate: 98.23,
    averageRating: 4.875,
    disputeRate: 1.2,
    schemaComplianceScore: 96,
    averageLatencyMinutes: 30,
    totalTasksCompleted: 412,
    endpointUrl: null,
    mcpServerUrl: null,
    ...overrides,
  } as unknown as AgentCardData;
}

describe("serializeAgent", () => {
  it("emits the snake_case public agent contract", () => {
    const out = serializeAgent(makeAgent());
    expect(out.short_description).toBe("Finds and qualifies leads.");
    expect(out.capabilities).toEqual(["lead-gen", "enrichment"]);
    expect(out.pricing).toEqual({ model: "per_task", starting_price: 25, currency: "USD" });
    expect(out.endpoint).toEqual({ url: null, mcp_server: null });
    expect(out.latency_minutes).toBe(30);
  });

  it("rounds the trust metrics to storage precision", () => {
    const { trust } = serializeAgent(makeAgent());
    expect(trust.verified).toBe(true);
    expect(trust.reputation_score).toBe(92);
    expect(trust.completion_rate).toBe(98.2); // 98.23 → 1 dp
    expect(trust.average_rating).toBe(4.88); // 4.875 → 2 dp
  });

  it("passes endpoints through when present", () => {
    const out = serializeAgent(
      makeAgent({ endpointUrl: "https://api.example.com", mcpServerUrl: "https://mcp.example.com" }),
    );
    expect(out.endpoint).toEqual({
      url: "https://api.example.com",
      mcp_server: "https://mcp.example.com",
    });
  });
});

function makeTask(overrides: Partial<Record<string, unknown>> = {}): TaskListItem {
  return {
    id: "task_1",
    title: "Find 50 leads",
    objective: "Qualified fintech leads.",
    category: "Growth",
    status: "pending",
    visibility: "public",
    budget: 120,
    currency: "USD",
    deadline: new Date("2026-07-04T00:00:00Z"),
    sellerAgent: { id: "a1", name: "Growth Research Agent", slug: "growth-research-agent" },
    payment: {
      mode: "mock_escrow",
      status: "escrowed",
      amount: 120,
      currency: "USD",
      provider: "mock_x402",
      transactionHash: "0xabc",
    },
    createdAt: new Date("2026-06-27T00:00:00Z"),
    updatedAt: new Date("2026-06-27T01:00:00Z"),
    ...overrides,
  } as unknown as TaskListItem;
}

describe("serializeTaskListItem", () => {
  it("emits ISO dates, nested seller_agent and snake_case payment", () => {
    const out = serializeTaskListItem(makeTask());
    expect(out.deadline).toBe("2026-07-04T00:00:00.000Z");
    expect(out.created_at).toBe("2026-06-27T00:00:00.000Z");
    expect(out.seller_agent).toEqual({
      id: "a1",
      name: "Growth Research Agent",
      slug: "growth-research-agent",
    });
    expect(out.payment).toEqual({
      mode: "mock_escrow",
      status: "escrowed",
      amount: 120,
      currency: "USD",
      provider: "mock_x402",
      transaction_hash: "0xabc",
    });
  });

  it("nulls deadline, seller_agent and payment when absent", () => {
    const out = serializeTaskListItem(
      makeTask({ deadline: null, sellerAgent: null, payment: null }),
    );
    expect(out.deadline).toBeNull();
    expect(out.seller_agent).toBeNull();
    expect(out.payment).toBeNull();
  });
});

describe("apiError", () => {
  it("returns just an error message by default", () => {
    const out = apiError("objective is required");
    expect(out).toEqual({ error: "objective is required" });
    expect("code" in out).toBe(false);
  });

  it("includes the code when supplied", () => {
    expect(apiError("nope", "validation_error")).toEqual({
      error: "nope",
      code: "validation_error",
    });
  });
});
