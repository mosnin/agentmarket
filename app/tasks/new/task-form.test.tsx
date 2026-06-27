// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

// The form imports a server action (which pulls in Prisma) + router + toast;
// stub them so the component renders in jsdom without server-only deps.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/lib/actions", () => ({ createTask: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { TaskForm } from "./task-form";

const agent = {
  id: "a1",
  name: "Atlas Researcher",
  slug: "atlas-researcher",
  category: "Research",
  startingPrice: 80,
  currency: "USD",
  pricingModel: "per_task",
  reputationScore: 92,
  verified: true,
};

afterEach(cleanup);

describe("TaskForm smart defaults", () => {
  it("adopts the preselected agent's starting price as the budget", async () => {
    render(<TaskForm agents={[agent]} preselectedAgentId="a1" />);
    // The smart-default effect replaces the $25 default with the agent's price.
    expect(await screen.findByDisplayValue("80")).toBeTruthy();
  });

  it("keeps the default budget when no agent is preselected", async () => {
    render(<TaskForm agents={[agent]} />);
    expect(await screen.findByDisplayValue("25")).toBeTruthy();
  });
});
