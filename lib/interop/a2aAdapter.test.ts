import { describe, it, expect } from "vitest";

import {
  getAgentCard,
  createTaskMessage,
  parseArtifactMessage,
  type AgentCardInput,
  type TaskMessageInput,
} from "@/lib/interop/a2aAdapter";

const agent: AgentCardInput = {
  id: "a1",
  slug: "growth-research-agent",
  name: "Growth Research Agent",
  shortDescription: "Finds and qualifies leads.",
  category: "Growth",
  capabilities: ["lead-gen", "enrichment"],
  pricingModel: "per_task",
  startingPrice: 25,
  currency: "USD",
  verified: true,
  reputationScore: 92,
};

describe("getAgentCard", () => {
  it("derives a protocol agent_id from the slug (hyphens → underscores)", () => {
    expect(getAgentCard(agent).agent_id).toBe("agent_growth_research_agent");
  });

  it("carries name, capabilities, pricing and trust", () => {
    const card = getAgentCard(agent);
    expect(card.name).toBe("Growth Research Agent");
    expect(card.capabilities).toEqual(["lead-gen", "enrichment"]);
    expect(card.pricing).toEqual({ model: "per_task", starting_price: 25, currency: "USD" });
    expect(card.trust).toEqual({ verified: true, reputation_score: 92 });
  });

  it("defaults missing endpoints to null and missing schemas to {}", () => {
    const card = getAgentCard(agent);
    expect(card.endpoint).toEqual({ url: null, mcp_server: null });
    expect(card.input_schema).toEqual({});
    expect(card.output_schema).toEqual({});
  });

  it("passes endpoints and schemas through when present", () => {
    const card = getAgentCard({
      ...agent,
      endpointUrl: "https://api.example.com/run",
      mcpServerUrl: "https://mcp.example.com",
      inputSchema: { query: "string" },
      outputSchema: { result: "string" },
    });
    expect(card.endpoint).toEqual({
      url: "https://api.example.com/run",
      mcp_server: "https://mcp.example.com",
    });
    expect(card.input_schema).toEqual({ query: "string" });
    expect(card.output_schema).toEqual({ result: "string" });
  });
});

const task: TaskMessageInput = {
  id: "task_1",
  title: "Find 50 leads",
  objective: "Qualified fintech leads in the US.",
  category: "Growth",
  budget: 120,
  currency: "USD",
};

describe("createTaskMessage", () => {
  it("builds a well-formed A2A task/create envelope", () => {
    const msg = createTaskMessage(task);
    expect(msg.protocol).toBe("a2a");
    expect(msg.type).toBe("task/create");
    expect(msg.role).toBe("user");
    expect(msg.task_id).toBe("task_1");
    expect(msg.payment).toEqual({ amount: 120, currency: "USD" });
    expect(msg.expected_output).toEqual({});
  });

  it("merges title + objective into a single text part when there is no payload", () => {
    const msg = createTaskMessage(task);
    expect(msg.parts).toHaveLength(1);
    expect(msg.parts[0]).toEqual({ kind: "text", text: "Find 50 leads\n\nQualified fintech leads in the US." });
  });

  it("appends a data part when an input payload is supplied", () => {
    const msg = createTaskMessage({ ...task, inputPayload: { region: "US" }, outputSchema: { leads: "array" } });
    expect(msg.parts).toHaveLength(2);
    expect(msg.parts[1]).toEqual({ kind: "data", data: { region: "US" } });
    expect(msg.expected_output).toEqual({ leads: "array" });
  });
});

describe("parseArtifactMessage", () => {
  it("round-trips text, data and file parts back to fields", () => {
    const parsed = parseArtifactMessage({
      artifact_id: "art_9",
      parts: [
        { kind: "text", text: "Here is the report." },
        { kind: "data", data: { rows: 3 } },
        { kind: "file", url: "https://files.example.com/report.pdf" },
      ],
    });
    expect(parsed.title).toBe("Artifact art_9");
    expect(parsed.content).toBe("Here is the report.");
    expect(parsed.data).toEqual({ rows: 3 });
    expect(parsed.url).toBe("https://files.example.com/report.pdf");
  });

  it("treats any part carrying a url as the file part", () => {
    const parsed = parseArtifactMessage({
      parts: [{ kind: "link", url: "https://example.com/out.csv" }],
    });
    expect(parsed.url).toBe("https://example.com/out.csv");
  });

  it("falls back to nulls and a generic title for an empty message", () => {
    const parsed = parseArtifactMessage({});
    expect(parsed).toEqual({ title: "Artifact", content: null, url: null, data: null });
  });
});
