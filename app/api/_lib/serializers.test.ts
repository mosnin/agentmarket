import { describe, it, expect } from "vitest";

import {
  serializeAgent,
  serializeAgentDetail,
  serializeTaskListItem,
  serializeTaskDetail,
  apiError,
} from "@/app/api/_lib/serializers";
import type {
  AgentCardData,
  AgentDetailData,
  TaskDetailData,
  TaskListItem,
} from "@/lib/data";

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

function makeTaskDetail(overrides: Partial<Record<string, unknown>> = {}): TaskDetailData {
  return {
    id: "task_1",
    title: "Find 50 leads",
    objective: "Qualified fintech leads.",
    category: "Growth",
    status: "submitted",
    visibility: "public",
    budget: 120,
    currency: "USD",
    deadline: new Date("2026-07-04T00:00:00Z"),
    createdAt: new Date("2026-06-27T00:00:00Z"),
    updatedAt: new Date("2026-06-27T01:00:00Z"),
    buyer: { id: "u1", name: "Operator" },
    sellerAgent: {
      id: "a1",
      name: "Growth Research Agent",
      slug: "growth-research-agent",
      category: "Growth",
    },
    payment: {
      mode: "mock_escrow",
      status: "escrowed",
      amount: 120,
      currency: "USD",
      provider: "mock_x402",
      transactionHash: "0xabc",
    },
    contract: {
      paymentMode: "mock_escrow",
      successCriteria: "Deliver 50 verified leads.",
      contractHash: "0xdeadbeef",
      inputPayload: { region: "US" },
      outputSchema: { leads: "array" },
      validationRules: { rules: ["non-empty"] },
    },
    artifacts: [
      {
        id: "art_1",
        title: "Leads v1",
        type: "file",
        url: "https://files.example.com/leads.csv",
        validationStatus: "passed",
        validationScore: 88,
        createdAt: new Date("2026-06-27T02:00:00Z"),
      },
    ],
    ...overrides,
  } as unknown as TaskDetailData;
}

describe("serializeTaskDetail", () => {
  it("includes the base task fields plus buyer", () => {
    const out = serializeTaskDetail(makeTaskDetail());
    expect(out.id).toBe("task_1");
    expect(out.seller_agent).toMatchObject({ slug: "growth-research-agent" });
    expect(out.payment).toMatchObject({ transaction_hash: "0xabc" });
    expect(out.buyer).toEqual({ id: "u1", name: "Operator" });
  });

  it("shapes the contract section into snake_case", () => {
    const out = serializeTaskDetail(makeTaskDetail());
    expect(out.contract).toEqual({
      payment_mode: "mock_escrow",
      success_criteria: "Deliver 50 verified leads.",
      contract_hash: "0xdeadbeef",
      input_payload: { region: "US" },
      output_schema: { leads: "array" },
      validation_rules: { rules: ["non-empty"] },
    });
  });

  it("emits a contract of null when there is none", () => {
    expect(serializeTaskDetail(makeTaskDetail({ contract: null })).contract).toBeNull();
  });

  it("serializes artifacts with ISO dates", () => {
    const [artifact] = serializeTaskDetail(makeTaskDetail()).artifacts;
    expect(artifact).toEqual({
      id: "art_1",
      title: "Leads v1",
      type: "file",
      url: "https://files.example.com/leads.csv",
      validation_status: "passed",
      validation_score: 88,
      created_at: "2026-06-27T02:00:00.000Z",
    });
  });

  it("falls back to 'Operator' when the buyer has no name", () => {
    const out = serializeTaskDetail(makeTaskDetail({ buyer: { id: "u1", name: null } }));
    expect(out.buyer.name).toBe("Operator");
  });

  it("attaches an x402 payment requirement + an A2A task message", () => {
    const out = serializeTaskDetail(makeTaskDetail());
    expect(out.payment_requirement.resource).toBe("/api/tasks/task_1");
    expect(out.payment_requirement.amount).toBe(120);
    expect(out.interop.a2a_message).toMatchObject({ protocol: "a2a", task_id: "task_1" });
  });
});

function makeAgentDetail(overrides: Partial<Record<string, unknown>> = {}): AgentDetailData {
  return {
    ...(makeAgent() as unknown as Record<string, unknown>),
    longDescription: "A long, detailed overview of the agent.",
    status: "active",
    organization: { id: "org1", name: "Helix Labs", slug: "helix-labs" },
    inputSchema: { q: "string" },
    outputSchema: { r: "string" },
    createdAt: new Date("2026-06-01T00:00:00Z"),
    _count: { reviews: 12, tasks: 30 },
    ...overrides,
  } as unknown as AgentDetailData;
}

describe("serializeAgentDetail", () => {
  it("extends the public agent with description, status and organization", () => {
    const out = serializeAgentDetail(makeAgentDetail());
    expect(out.short_description).toBe("Finds and qualifies leads.");
    expect(out.long_description).toBe("A long, detailed overview of the agent.");
    expect(out.status).toBe("active");
    expect(out.organization).toEqual({ id: "org1", name: "Helix Labs", slug: "helix-labs" });
  });

  it("exposes schemas, metrics and the interop surface", () => {
    const out = serializeAgentDetail(makeAgentDetail());
    expect(out.schemas).toEqual({ input: { q: "string" }, output: { r: "string" } });
    expect(out.metrics.review_count).toBe(12);
    expect(out.metrics.task_count).toBe(30);
    expect(out.metrics.total_tasks_completed).toBe(412);
    expect(out.interop.a2a_card.agent_id).toBe("agent_growth_research_agent");
    expect(out.interop.mcp.tools).toHaveLength(2);
    expect(out.created_at).toBe("2026-06-01T00:00:00.000Z");
  });

  it("emits organization null when the agent has none", () => {
    expect(serializeAgentDetail(makeAgentDetail({ organization: null })).organization).toBeNull();
  });
});
