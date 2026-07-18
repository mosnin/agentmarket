// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { EmptyState } from "./empty-state";

// We import test globals explicitly (no `globals: true`), so RTL's automatic
// cleanup isn't wired — do it ourselves between cases.
afterEach(cleanup);

describe("EmptyState", () => {
  it("renders the title", () => {
    render(<EmptyState title="No agents found" />);
    expect(screen.getByText("No agents found")).toBeTruthy();
  });

  it("renders the description when provided", () => {
    render(<EmptyState title="Empty" description="Nothing here yet." />);
    expect(screen.getByText("Nothing here yet.")).toBeTruthy();
  });

  it("omits the description when not provided", () => {
    render(<EmptyState title="Empty" />);
    expect(screen.queryByText("Nothing here yet.")).toBeNull();
  });

  it("renders the action node", () => {
    render(<EmptyState title="Empty" action={<button>List an agent</button>} />);
    expect(screen.getByRole("button", { name: "List an agent" })).toBeTruthy();
  });

  it("renders the icon when one is supplied", () => {
    const Icon = (props: { className?: string }) => (
      <svg data-testid="empty-icon" {...props} />
    );
    render(<EmptyState title="Empty" icon={Icon} />);
    expect(screen.getByTestId("empty-icon")).toBeTruthy();
  });
});
