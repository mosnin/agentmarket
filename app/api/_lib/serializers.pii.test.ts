import { describe, it, expect } from "vitest";

import {
  serializeAgent,
  serializeAgentDetail,
  serializeTaskListItem,
  serializeTaskDetail,
} from "@/app/api/_lib/serializers";
import type {
  AgentCardData,
  AgentDetailData,
  TaskDetailData,
  TaskListItem,
} from "@/lib/data";

/**
 * Security regression suite: `serializers.ts` is the API's data-minimization
 * boundary. The Prisma payloads it receives carry real `owner.email` /
 * `buyer.email` / `user.email` fields (see `lib/data.ts` includes), but the
 * public JSON shapes it emits must NEVER contain them — an `email` field
 * name, or its value, must not appear anywhere in a `serialize*` output.
 *
 * Every fixture below plants a sentinel email deep in every nested
 * user/owner/buyer object the real Prisma include tree would attach, then
 * asserts the serializer's output is completely free of it.
 */

const SENTINEL_EMAIL = "LEAK-canary@secret.internal";

/**
 * Recursively collects the dot-paths of any object key literally named
 * `email` (case-insensitively) found anywhere in `value`. Used on the
 * JSON-round-tripped serializer output, i.e. exactly what would go over the
 * wire.
 */
function collectEmailKeyPaths(value: unknown, path = "$"): string[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectEmailKeyPaths(item, `${path}[${index}]`));
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.keys(record).flatMap((key) => {
      const childPath = `${path}.${key}`;
      const selfHit = key.toLowerCase() === "email" ? [childPath] : [];
      return [...selfHit, ...collectEmailKeyPaths(record[key], childPath)];
    });
  }
  return [];
}

/**
 * Asserts a serializer's return value is free of PII: no sentinel email
 * substring anywhere in the serialized JSON, and no key named `email` at any
 * depth of the object graph that would actually reach a client.
 */
function assertNoEmails(value: unknown): void {
  const json = JSON.stringify(value);
  expect(json).not.toContain(SENTINEL_EMAIL);
  expect(collectEmailKeyPaths(JSON.parse(json))).toEqual([]);
}

/** A Prisma `User` record shape with a sentinel email planted in it. Real
 * names are left intact — this suite only forbids emails, not names. */
function makeLeakyUser(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: "user_leaky",
    email: SENTINEL_EMAIL,
    name: "Real Person Name",
    role: "user",
    image: null,
    organizationId: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// serializeAgent
// ---------------------------------------------------------------------------

function makeAgentCardData(overrides: Partial<Record<string, unknown>> = {}): AgentCardData {
  return {
    id: "agent_1",
    slug: "growth-research-agent",
    name: "Growth Research Agent",
    shortDescription: "Finds and qualifies leads.",
    longDescription: "A deep-dive lead generation and qualification specialist.",
    category: "Growth",
    status: "active",
    verified: true,
    endpointUrl: null,
    mcpServerUrl: null,
    inputSchema: { q: "string" },
    outputSchema: { r: "string" },
    pricingModel: "per_task",
    startingPrice: 25,
    currency: "USD",
    averageRating: 4.875,
    reputationScore: 92,
    completionRate: 98.23,
    averageLatencyMinutes: 30,
    schemaComplianceScore: 96,
    disputeRate: 1.2,
    totalTasksCompleted: 412,
    ownerId: "user_owner",
    organizationId: "org_1",
    createdAt: new Date("2026-06-01T00:00:00Z"),
    updatedAt: new Date("2026-06-01T00:00:00Z"),
    capabilities: [
      { capability: { name: "lead-gen" } },
      { capability: { name: "enrichment" } },
    ],
    organization: {
      id: "org_1",
      name: "Helix Labs",
      slug: "helix-labs",
      description: null,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
    },
    // Real Prisma payloads attach the full owner record (agentCardInclude
    // sets `owner: true`), including their email — this must never surface.
    owner: makeLeakyUser({ id: "user_owner", name: "Agent Owner Real Name" }),
    _count: { reviews: 12, tasks: 30 },
    ...overrides,
  } as unknown as AgentCardData;
}

describe("serializeAgent — PII regression", () => {
  it("never leaks the owner's email or an `email` key, but still emits public fields", () => {
    const out = serializeAgent(makeAgentCardData());

    assertNoEmails(out);
    expect(JSON.stringify(out)).not.toContain(SENTINEL_EMAIL);

    // Positive control — proves the serializer actually ran.
    expect(out.id).toBe("agent_1");
    expect(out.slug).toBe("growth-research-agent");
    expect(out.name).toBe("Growth Research Agent");
  });
});

// ---------------------------------------------------------------------------
// serializeAgentDetail
// ---------------------------------------------------------------------------

function makeAgentDetailData(overrides: Partial<Record<string, unknown>> = {}): AgentDetailData {
  return {
    ...(makeAgentCardData() as unknown as Record<string, unknown>),
    // agentDetailInclude additionally attaches reviews (with `user`) and the
    // agent's recent tasks (with `buyer`) — both real Prisma User records.
    reviews: [
      {
        id: "review_1",
        taskId: "task_1",
        agentId: "agent_1",
        userId: "user_reviewer",
        rating: 5,
        comment: "Excellent, fast turnaround.",
        createdAt: new Date("2026-06-20T00:00:00Z"),
        updatedAt: new Date("2026-06-20T00:00:00Z"),
        user: makeLeakyUser({ id: "user_reviewer", name: "Reviewer Real Name" }),
        task: { id: "task_1", title: "Find 50 leads" },
      },
    ],
    tasks: [
      {
        id: "task_1",
        title: "Find 50 leads",
        objective: "Qualified fintech leads.",
        category: "Growth",
        status: "completed",
        visibility: "public",
        budget: 120,
        currency: "USD",
        deadline: null,
        buyerId: "user_buyer",
        buyer: makeLeakyUser({ id: "user_buyer", name: "Buyer Real Name" }),
        sellerAgentId: "agent_1",
        createdAt: new Date("2026-06-10T00:00:00Z"),
        updatedAt: new Date("2026-06-11T00:00:00Z"),
        payment: {
          id: "pay_1",
          taskId: "task_1",
          amount: 120,
          currency: "USD",
          status: "released",
          mode: "mock_escrow",
          provider: "mock_x402",
          transactionHash: "0xabc",
          createdAt: new Date("2026-06-11T00:00:00Z"),
          updatedAt: new Date("2026-06-11T00:00:00Z"),
        },
        artifacts: [],
      },
    ],
    reputationEvents: [
      {
        id: "rep_1",
        agentId: "agent_1",
        taskId: "task_1",
        type: "task_completed",
        scoreDelta: 2,
        reason: "Completed on time.",
        createdAt: new Date("2026-06-11T00:00:00Z"),
      },
    ],
    ...overrides,
  } as unknown as AgentDetailData;
}

describe("serializeAgentDetail — PII regression", () => {
  it("never leaks owner/reviewer/buyer emails or an `email` key, but still emits public fields", () => {
    const out = serializeAgentDetail(makeAgentDetailData());

    assertNoEmails(out);
    expect(JSON.stringify(out)).not.toContain(SENTINEL_EMAIL);

    // Positive control — proves the serializer actually ran.
    expect(out.id).toBe("agent_1");
    expect(out.name).toBe("Growth Research Agent");
    expect(out.long_description).toBe("A deep-dive lead generation and qualification specialist.");
    expect(out.organization).toEqual({ id: "org_1", name: "Helix Labs", slug: "helix-labs" });
    expect(out.metrics.review_count).toBe(12);
  });
});

// ---------------------------------------------------------------------------
// serializeTaskListItem
// ---------------------------------------------------------------------------

function makeTaskListItemData(overrides: Partial<Record<string, unknown>> = {}): TaskListItem {
  return {
    id: "task_list_1",
    title: "Find 50 leads",
    objective: "Qualified fintech leads.",
    category: "Growth",
    status: "pending",
    visibility: "public",
    budget: 120,
    currency: "USD",
    deadline: new Date("2026-07-04T00:00:00Z"),
    buyerId: "user_buyer",
    // taskListInclude sets `buyer: true` — the full User record, email included.
    buyer: makeLeakyUser({ id: "user_buyer", name: "Buyer Real Name" }),
    sellerAgentId: "agent_1",
    sellerAgent: {
      id: "agent_1",
      name: "Growth Research Agent",
      slug: "growth-research-agent",
      category: "Growth",
    },
    payment: {
      id: "pay_list_1",
      taskId: "task_list_1",
      amount: 120,
      currency: "USD",
      status: "escrowed",
      mode: "mock_escrow",
      provider: "mock_x402",
      transactionHash: "0xabc",
      createdAt: new Date("2026-06-27T00:00:00Z"),
      updatedAt: new Date("2026-06-27T00:00:00Z"),
    },
    createdAt: new Date("2026-06-27T00:00:00Z"),
    updatedAt: new Date("2026-06-27T01:00:00Z"),
    ...overrides,
  } as unknown as TaskListItem;
}

describe("serializeTaskListItem — PII regression", () => {
  it("never leaks the buyer's email or an `email` key, but still emits public fields", () => {
    const out = serializeTaskListItem(makeTaskListItemData());

    assertNoEmails(out);
    expect(JSON.stringify(out)).not.toContain(SENTINEL_EMAIL);

    // Positive control — proves the serializer actually ran. Note there is no
    // `buyer` field at all in the list-item contract; only seller_agent is public.
    expect(out.id).toBe("task_list_1");
    expect(out.title).toBe("Find 50 leads");
    expect(out.seller_agent).toEqual({
      id: "agent_1",
      name: "Growth Research Agent",
      slug: "growth-research-agent",
    });
  });
});

// ---------------------------------------------------------------------------
// serializeTaskDetail
// ---------------------------------------------------------------------------

function makeTaskDetailData(overrides: Partial<Record<string, unknown>> = {}): TaskDetailData {
  return {
    id: "task_detail_1",
    title: "Find 50 leads",
    objective: "Qualified fintech leads.",
    category: "Growth",
    status: "submitted",
    visibility: "public",
    budget: 120,
    currency: "USD",
    deadline: new Date("2026-07-04T00:00:00Z"),
    buyerId: "user_buyer",
    // taskDetailInclude sets `buyer: true`.
    buyer: makeLeakyUser({ id: "user_buyer", name: "Buyer Real Name" }),
    sellerAgentId: "agent_1",
    // taskDetailInclude includes sellerAgent.owner — another real User record.
    sellerAgent: {
      id: "agent_1",
      name: "Growth Research Agent",
      slug: "growth-research-agent",
      category: "Growth",
      capabilities: [{ capability: { name: "lead-gen" } }],
      owner: makeLeakyUser({ id: "user_owner", name: "Agent Owner Real Name" }),
    },
    contract: {
      id: "contract_1",
      taskId: "task_detail_1",
      inputPayload: { region: "US" },
      outputSchema: { leads: "array" },
      validationRules: { rules: ["non-empty"] },
      paymentMode: "mock_escrow",
      successCriteria: "Deliver 50 verified leads.",
      contractHash: "0xdeadbeef",
      createdAt: new Date("2026-06-27T00:00:00Z"),
      updatedAt: new Date("2026-06-27T00:00:00Z"),
    },
    artifacts: [
      {
        id: "art_1",
        taskId: "task_detail_1",
        title: "Leads v1",
        type: "file",
        url: "https://files.example.com/leads.csv",
        content: null,
        validationStatus: "passed",
        validationScore: 88,
        createdAt: new Date("2026-06-27T02:00:00Z"),
        updatedAt: new Date("2026-06-27T02:00:00Z"),
      },
    ],
    payment: {
      id: "pay_detail_1",
      taskId: "task_detail_1",
      amount: 120,
      currency: "USD",
      status: "escrowed",
      mode: "mock_escrow",
      provider: "mock_x402",
      transactionHash: "0xabc",
      createdAt: new Date("2026-06-27T00:00:00Z"),
      updatedAt: new Date("2026-06-27T00:00:00Z"),
    },
    // taskDetailInclude includes reviews.user and disputes.openedBy — both
    // real User records the serializer never looks at, but must still not leak.
    reviews: [
      {
        id: "review_1",
        taskId: "task_detail_1",
        agentId: "agent_1",
        userId: "user_reviewer",
        rating: 5,
        comment: "Excellent, fast turnaround.",
        createdAt: new Date("2026-06-28T00:00:00Z"),
        updatedAt: new Date("2026-06-28T00:00:00Z"),
        user: makeLeakyUser({ id: "user_reviewer", name: "Reviewer Real Name" }),
      },
    ],
    disputes: [
      {
        id: "dispute_1",
        taskId: "task_detail_1",
        openedById: "user_buyer",
        reason: "Late delivery.",
        status: "resolved",
        resolution: "Partial refund issued.",
        createdAt: new Date("2026-06-29T00:00:00Z"),
        updatedAt: new Date("2026-06-29T01:00:00Z"),
        openedBy: makeLeakyUser({ id: "user_buyer", name: "Buyer Real Name" }),
      },
    ],
    reputationEvents: [
      {
        id: "rep_1",
        agentId: "agent_1",
        taskId: "task_detail_1",
        type: "task_completed",
        scoreDelta: 2,
        reason: "Completed on time.",
        createdAt: new Date("2026-06-29T02:00:00Z"),
      },
    ],
    createdAt: new Date("2026-06-27T00:00:00Z"),
    updatedAt: new Date("2026-06-27T01:00:00Z"),
    ...overrides,
  } as unknown as TaskDetailData;
}

describe("serializeTaskDetail — PII regression", () => {
  it("never leaks buyer/seller-owner/reviewer/disputant emails or an `email` key, but still emits public fields", () => {
    const out = serializeTaskDetail(makeTaskDetailData());

    assertNoEmails(out);
    expect(JSON.stringify(out)).not.toContain(SENTINEL_EMAIL);

    // Positive control — proves the serializer actually ran.
    expect(out.id).toBe("task_detail_1");
    expect(out.title).toBe("Find 50 leads");
    expect(out.seller_agent).toEqual({
      id: "agent_1",
      name: "Growth Research Agent",
      slug: "growth-research-agent",
    });
    expect(out.contract).toMatchObject({ contract_hash: "0xdeadbeef" });

    // The buyer's name is intentionally public; only the email must be gone.
    expect(out.buyer).toEqual({ id: "user_buyer", name: "Buyer Real Name" });
    expect(out.buyer).not.toHaveProperty("email");
  });
});

// ---------------------------------------------------------------------------
// Helper self-test
// ---------------------------------------------------------------------------

describe("assertNoEmails", () => {
  it("actually fails on a value that leaks an email (sanity check for this suite)", () => {
    const leaking = { owner: { name: "x", email: SENTINEL_EMAIL } };
    expect(() => assertNoEmails(leaking)).toThrow();
  });

  it("fails on a leaked email key even if the sentinel value differs", () => {
    const leaking = { buyer: { name: "x", email: "someone-else@example.com" } };
    expect(() => assertNoEmails(leaking)).toThrow();
  });
});
