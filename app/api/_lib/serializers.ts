/**
 * Public API serializers.
 *
 * These functions translate internal Prisma records into the clean, stable
 * JSON shapes returned by the programmable `/api/*` endpoints. Keeping them in
 * one place guarantees the search palette, the developer docs page and every
 * route handler all agree on the contract.
 *
 * This module lives under `app/api` (a route-handler-only tree) and is imported
 * exclusively by server-side route handlers, so it may safely depend on the
 * Prisma-backed read layer + interop adapters.
 */

import type { AgentCardData, AgentDetailData, TaskDetailData, TaskListItem } from "@/lib/data";
import { getAgentCard } from "@/lib/interop/a2aAdapter";
import { listToolsForAgent, validateMcpServer } from "@/lib/interop/mcpAdapter";
import { createPaymentRequirement } from "@/lib/payments/x402Adapter";

// ---------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------

export interface PublicAgent {
  id: string;
  slug: string;
  name: string;
  category: string;
  short_description: string;
  capabilities: string[];
  pricing: {
    model: string;
    starting_price: number;
    currency: string;
  };
  trust: {
    verified: boolean;
    reputation_score: number;
    completion_rate: number;
    average_rating: number;
  };
  endpoint: {
    url: string | null;
    mcp_server: string | null;
  };
  latency_minutes: number;
}

/** Extract a flat list of capability names from an agent record. */
function capabilityNames(
  agent: Pick<AgentCardData, "capabilities">,
): string[] {
  return agent.capabilities.map((c) => c.capability.name);
}

/**
 * The canonical public agent shape. Consumed by `GET /api/agents`, the search
 * palette and the developer docs. `completion_rate` is stored as a percentage
 * in the 0–100 range (e.g. 98.2, not 0.982) and is emitted as-is; the
 * `Math.round(x * 10) / 10` is a pure 1-decimal-place rounding to match the
 * storage precision (see lib/reputation.ts / lib/seed.ts), NOT a fraction->
 * percent conversion. `average_rating` is a 0–5 star value. `reputation_score`
 * is an integer 0–100.
 */
export function serializeAgent(agent: AgentCardData): PublicAgent {
  return {
    id: agent.id,
    slug: agent.slug,
    name: agent.name,
    category: agent.category,
    short_description: agent.shortDescription,
    capabilities: capabilityNames(agent),
    pricing: {
      model: agent.pricingModel,
      starting_price: agent.startingPrice,
      currency: agent.currency,
    },
    trust: {
      verified: agent.verified,
      reputation_score: agent.reputationScore,
      completion_rate: Math.round(agent.completionRate * 10) / 10,
      average_rating: Math.round(agent.averageRating * 100) / 100,
    },
    endpoint: {
      url: agent.endpointUrl ?? null,
      mcp_server: agent.mcpServerUrl ?? null,
    },
    latency_minutes: agent.averageLatencyMinutes,
  };
}

/** Coerce a Prisma `Json?` column into a plain object (or null). */
function asJsonObject(
  value: unknown,
): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/**
 * Detailed agent payload for `GET /api/agents/:id`. Includes the public shape,
 * the A2A agent card (so other agents can negotiate directly), the derived MCP
 * tool surface, and the full trust/performance metric set.
 */
export function serializeAgentDetail(agent: AgentDetailData) {
  const capabilities = agent.capabilities.map((c) => c.capability.name);

  const a2aCard = getAgentCard({
    id: agent.id,
    slug: agent.slug,
    name: agent.name,
    shortDescription: agent.shortDescription,
    category: agent.category,
    capabilities,
    pricingModel: agent.pricingModel,
    startingPrice: agent.startingPrice,
    currency: agent.currency,
    endpointUrl: agent.endpointUrl,
    mcpServerUrl: agent.mcpServerUrl,
    verified: agent.verified,
    reputationScore: agent.reputationScore,
    inputSchema: asJsonObject(agent.inputSchema),
    outputSchema: asJsonObject(agent.outputSchema),
  });

  const mcpTools = listToolsForAgent({ capabilities, category: agent.category });
  const mcpServer = validateMcpServer(agent.mcpServerUrl);

  return {
    ...serializeAgent(agent),
    long_description: agent.longDescription,
    status: agent.status,
    organization: agent.organization
      ? { id: agent.organization.id, name: agent.organization.name, slug: agent.organization.slug }
      : null,
    schemas: {
      input: asJsonObject(agent.inputSchema) ?? {},
      output: asJsonObject(agent.outputSchema) ?? {},
    },
    metrics: {
      reputation_score: agent.reputationScore,
      average_rating: Math.round(agent.averageRating * 100) / 100,
      // completion_rate / dispute_rate are 0–100 percentages; round to 1 decimal
      // to match storage precision (lib/reputation.ts), not a unit conversion.
      completion_rate: Math.round(agent.completionRate * 10) / 10,
      dispute_rate: Math.round(agent.disputeRate * 10) / 10,
      schema_compliance_score: Math.round(agent.schemaComplianceScore),
      average_latency_minutes: agent.averageLatencyMinutes,
      total_tasks_completed: agent.totalTasksCompleted,
      review_count: agent._count.reviews,
      task_count: agent._count.tasks,
    },
    interop: {
      a2a_card: a2aCard,
      mcp: {
        server: mcpServer,
        tools: mcpTools,
      },
    },
    created_at: agent.createdAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export interface PublicTaskPayment {
  mode: string;
  status: string;
  amount: number;
  currency: string;
  provider: string;
  transaction_hash: string | null;
}

export interface PublicTask {
  id: string;
  title: string;
  objective: string;
  category: string;
  status: string;
  visibility: string;
  budget: number;
  currency: string;
  deadline: string | null;
  seller_agent: { id: string; name: string; slug: string } | null;
  payment: PublicTaskPayment | null;
  created_at: string;
  updated_at: string;
}

function serializePayment(
  payment: { mode: string; status: string; amount: number; currency: string; provider: string; transactionHash: string | null } | null,
): PublicTaskPayment | null {
  if (!payment) return null;
  return {
    mode: payment.mode,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    provider: payment.provider,
    transaction_hash: payment.transactionHash ?? null,
  };
}

/** Compact public task shape for list endpoints. */
export function serializeTaskListItem(task: TaskListItem): PublicTask {
  return {
    id: task.id,
    title: task.title,
    objective: task.objective,
    category: task.category,
    status: task.status,
    visibility: task.visibility,
    budget: task.budget,
    currency: task.currency,
    deadline: task.deadline ? task.deadline.toISOString() : null,
    seller_agent: task.sellerAgent
      ? { id: task.sellerAgent.id, name: task.sellerAgent.name, slug: task.sellerAgent.slug }
      : null,
    payment: serializePayment(task.payment),
    created_at: task.createdAt.toISOString(),
    updated_at: task.updatedAt.toISOString(),
  };
}

/**
 * Full public task payload for `GET /api/tasks/:id`. Includes the contract,
 * artifacts (with validation outcomes) and the x402 payment requirement a
 * paying agent would settle against.
 */
export function serializeTaskDetail(task: TaskDetailData) {
  const base = serializeTaskListItem({
    ...task,
    sellerAgent: task.sellerAgent
      ? {
          id: task.sellerAgent.id,
          name: task.sellerAgent.name,
          slug: task.sellerAgent.slug,
          category: task.sellerAgent.category,
        }
      : null,
  } as unknown as TaskListItem);

  const paymentRequirement = createPaymentRequirement({
    taskId: task.id,
    amount: task.budget,
    currency: task.currency,
  });

  return {
    ...base,
    buyer: { id: task.buyer.id, name: task.buyer.name ?? "Operator" },
    contract: task.contract
      ? {
          payment_mode: task.contract.paymentMode,
          success_criteria: task.contract.successCriteria,
          contract_hash: task.contract.contractHash,
          input_payload: asJsonObject(task.contract.inputPayload) ?? {},
          output_schema: asJsonObject(task.contract.outputSchema) ?? {},
          validation_rules: asJsonObject(task.contract.validationRules) ?? {},
        }
      : null,
    artifacts: task.artifacts.map((a) => ({
      id: a.id,
      title: a.title,
      type: a.type,
      url: a.url ?? null,
      validation_status: a.validationStatus,
      validation_score: a.validationScore ?? null,
      created_at: a.createdAt.toISOString(),
    })),
    payment_requirement: paymentRequirement,
  };
}

// ---------------------------------------------------------------------------
// Error helper
// ---------------------------------------------------------------------------

export interface ApiErrorBody {
  error: string;
  code?: string;
}

export function apiError(message: string, code?: string): ApiErrorBody {
  return code ? { error: message, code } : { error: message };
}
