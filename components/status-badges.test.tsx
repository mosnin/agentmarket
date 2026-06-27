// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { PaymentStatusBadge } from "@/components/tasks/payment-status-badge";
import { AgentStatusBadge } from "@/app/seller/agent-status-badge";
import {
  TASK_STATUS_META,
  PAYMENT_STATUS_META,
  AGENT_STATUS_META,
} from "@/lib/constants";

afterEach(cleanup);

describe("TaskStatusBadge", () => {
  it("renders the META label for a known status", () => {
    render(<TaskStatusBadge status="running" />);
    expect(screen.getByText(TASK_STATUS_META.running.label)).toBeTruthy();
  });
  it("falls back to 'Unknown' for an unrecognized status", () => {
    render(<TaskStatusBadge status="bogus" />);
    expect(screen.getByText("Unknown")).toBeTruthy();
  });
});

describe("PaymentStatusBadge", () => {
  it("renders the META label for a known status", () => {
    render(<PaymentStatusBadge status="escrowed" />);
    expect(screen.getByText(PAYMENT_STATUS_META.escrowed.label)).toBeTruthy();
  });
  it("falls back to 'Unknown' for an unrecognized status", () => {
    render(<PaymentStatusBadge status="bogus" />);
    expect(screen.getByText("Unknown")).toBeTruthy();
  });
});

describe("AgentStatusBadge", () => {
  it("renders the META label for known statuses", () => {
    render(<AgentStatusBadge status="suspended" />);
    expect(screen.getByText(AGENT_STATUS_META.suspended.label)).toBeTruthy();
    cleanup();
    render(<AgentStatusBadge status="archived" />);
    expect(screen.getByText(AGENT_STATUS_META.archived.label)).toBeTruthy();
  });
  it("falls back to 'Unknown' for an unrecognized status", () => {
    render(<AgentStatusBadge status="bogus" />);
    expect(screen.getByText("Unknown")).toBeTruthy();
  });
});
