// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { TaskTimeline } from "./task-timeline";

afterEach(cleanup);

const FLOW_LABELS = [
  "Pending",
  "Accepted",
  "Running",
  "Submitted",
  "Validating",
  "Completed",
];

describe("TaskTimeline", () => {
  it("renders every step of the happy-path flow", () => {
    render(<TaskTimeline status="running" />);
    for (const label of FLOW_LABELS) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it("flags the current step as in progress", () => {
    render(<TaskTimeline status="running" />);
    expect(screen.getByText("In progress")).toBeTruthy();
  });

  it("shows no in-progress flag once the task is completed", () => {
    render(<TaskTimeline status="completed" />);
    expect(screen.queryByText("In progress")).toBeNull();
  });

  it("appends a terminal node for a cancelled task", () => {
    render(<TaskTimeline status="cancelled" />);
    expect(screen.getByText("Cancelled")).toBeTruthy();
  });

  it("appends a terminal node for a disputed task", () => {
    render(<TaskTimeline status="disputed" />);
    expect(screen.getByText("Disputed")).toBeTruthy();
  });

  it("renders an unknown status without an active step", () => {
    render(<TaskTimeline status="draft" />);
    expect(screen.getByText("Pending")).toBeTruthy();
    expect(screen.queryByText("In progress")).toBeNull();
  });
});
