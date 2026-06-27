// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { AgentCard } from "./agent-card";
import type { AgentCardData } from "@/lib/data";

function makeAgent(overrides: Partial<Record<string, unknown>> = {}): AgentCardData {
  return {
    id: "a1",
    slug: "atlas-researcher",
    name: "Atlas Researcher",
    category: "Research",
    shortDescription: "Citation-grade research briefs on demand.",
    capabilities: [
      { capability: { name: "research" } },
      { capability: { name: "synthesis" } },
      { capability: { name: "citations" } },
      { capability: { name: "summaries" } },
    ],
    pricingModel: "per_task",
    startingPrice: 25,
    currency: "USD",
    verified: true,
    reputationScore: 92,
    averageRating: 4.8,
    completionRate: 98,
    disputeRate: 1,
    schemaComplianceScore: 96,
    averageLatencyMinutes: 30,
    totalTasksCompleted: 100,
    organization: { name: "Helix Labs" },
    endpointUrl: null,
    mcpServerUrl: null,
    ...overrides,
  } as unknown as AgentCardData;
}

afterEach(cleanup);

describe("AgentCard", () => {
  it("renders the name, category, description and price", () => {
    render(<AgentCard agent={makeAgent()} />);
    expect(screen.getByRole("heading", { name: "Atlas Researcher" })).toBeTruthy();
    expect(screen.getByText("Research")).toBeTruthy();
    expect(screen.getByText("Citation-grade research briefs on demand.")).toBeTruthy();
    expect(screen.getByText("$25/task")).toBeTruthy();
  });

  it("shows the first three capabilities and a '+N more' overflow", () => {
    render(<AgentCard agent={makeAgent()} />);
    expect(screen.getByText("research")).toBeTruthy();
    expect(screen.getByText("synthesis")).toBeTruthy();
    expect(screen.getByText("citations")).toBeTruthy();
    expect(screen.getByText("+1 more")).toBeTruthy();
    expect(screen.queryByText("summaries")).toBeNull();
  });

  it("links Hire to a contract pre-filled with this agent", () => {
    render(<AgentCard agent={makeAgent()} />);
    const hire = screen.getByRole("link", { name: "Hire Atlas Researcher" });
    expect(hire.getAttribute("href")).toBe("/tasks/new?agent=atlas-researcher");
  });

  it("links the card body to the agent profile", () => {
    render(<AgentCard agent={makeAgent()} />);
    const profile = screen.getByRole("link", { name: "View Atlas Researcher's profile" });
    expect(profile.getAttribute("href")).toBe("/agents/atlas-researcher");
  });

  it("shows 'New' instead of a rating when the agent has none yet", () => {
    render(<AgentCard agent={makeAgent({ averageRating: 0 })} />);
    expect(screen.getByText("New")).toBeTruthy();
  });
});
