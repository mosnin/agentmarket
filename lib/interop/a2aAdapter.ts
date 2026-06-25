/**
 * A2A (Agent-to-Agent) interop adapter (MOCK / local data).
 *
 * A2A is an open protocol for agents to advertise capabilities ("agent cards"),
 * exchange task messages, and return artifacts. This adapter builds A2A-shaped
 * payloads from local marketplace records so other agents could integrate today.
 *
 * To go live: set `A2A_REGISTRY_URL` and publish/fetch these cards + messages
 * from a real A2A registry instead of constructing them locally.
 */

export interface AgentCardInput {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  category: string;
  capabilities: string[];
  pricingModel: string;
  startingPrice: number;
  currency: string;
  endpointUrl?: string | null;
  mcpServerUrl?: string | null;
  verified: boolean;
  reputationScore: number;
  inputSchema?: Record<string, unknown> | null;
  outputSchema?: Record<string, unknown> | null;
}

export interface AgentCard {
  agent_id: string;
  name: string;
  capabilities: string[];
  pricing: { model: string; starting_price: number; currency: string };
  endpoint: { url: string | null; mcp_server: string | null };
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
  trust: { verified: boolean; reputation_score: number };
}

export interface TaskMessageInput {
  id: string;
  title: string;
  objective: string;
  category: string;
  budget: number;
  currency: string;
  inputPayload?: Record<string, unknown> | null;
  outputSchema?: Record<string, unknown> | null;
}

export interface TaskMessage {
  protocol: "a2a";
  type: "task/create";
  task_id: string;
  role: "user";
  parts: Array<{ kind: "text" | "data"; text?: string; data?: unknown }>;
  payment: { amount: number; currency: string };
  expected_output: Record<string, unknown>;
}

const isLive = Boolean(process.env.A2A_REGISTRY_URL);

export function getAgentCard(agent: AgentCardInput): AgentCard {
  return {
    agent_id: `agent_${agent.slug.replace(/-/g, "_")}`,
    name: agent.name,
    capabilities: agent.capabilities,
    pricing: {
      model: agent.pricingModel,
      starting_price: agent.startingPrice,
      currency: agent.currency,
    },
    endpoint: {
      url: agent.endpointUrl ?? null,
      mcp_server: agent.mcpServerUrl ?? null,
    },
    input_schema: agent.inputSchema ?? {},
    output_schema: agent.outputSchema ?? {},
    trust: {
      verified: agent.verified,
      reputation_score: agent.reputationScore,
    },
  };
}

export function createTaskMessage(task: TaskMessageInput): TaskMessage {
  return {
    protocol: "a2a",
    type: "task/create",
    task_id: task.id,
    role: "user",
    parts: [
      { kind: "text", text: `${task.title}\n\n${task.objective}` },
      ...(task.inputPayload
        ? [{ kind: "data" as const, data: task.inputPayload }]
        : []),
    ],
    payment: { amount: task.budget, currency: task.currency },
    expected_output: task.outputSchema ?? {},
  };
}

export interface ArtifactMessage {
  artifact_id?: string;
  parts?: Array<{ kind: string; text?: string; data?: unknown; url?: string }>;
}

export function parseArtifactMessage(message: ArtifactMessage): {
  title: string;
  content: string | null;
  url: string | null;
  data: unknown;
} {
  const parts = message.parts ?? [];
  const textPart = parts.find((p) => p.kind === "text");
  const dataPart = parts.find((p) => p.kind === "data");
  const filePart = parts.find((p) => p.kind === "file" || p.url);
  return {
    title: message.artifact_id ? `Artifact ${message.artifact_id}` : "Artifact",
    content: textPart?.text ?? null,
    url: filePart?.url ?? null,
    data: dataPart?.data ?? null,
  };
}

export const a2a = {
  isLive,
  getAgentCard,
  createTaskMessage,
  parseArtifactMessage,
};
