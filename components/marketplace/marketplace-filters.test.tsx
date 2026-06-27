// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

// Hoisted so the mock factory can reference the spies/params, and tests can vary
// the active filters per case.
const h = vi.hoisted(() => ({ push: vi.fn(), params: new URLSearchParams() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: h.push }),
  usePathname: () => "/marketplace",
  useSearchParams: () => h.params,
}));

import { MarketplaceFilters } from "./marketplace-filters";

beforeEach(() => {
  h.push.mockReset();
  h.params = new URLSearchParams();
});
afterEach(cleanup);

describe("MarketplaceFilters", () => {
  it("hides the Clear reset and reads 'No filters' when nothing is active", () => {
    render(<MarketplaceFilters />);
    expect(screen.getByText("No filters")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /clear/i })).toBeNull();
  });

  it("shows Clear when a filter is active and resets to a bare /marketplace", () => {
    h.params = new URLSearchParams("category=Coding");
    render(<MarketplaceFilters />);
    expect(screen.getByText("Filters active")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /clear/i }));
    expect(h.push).toHaveBeenCalled();
    expect(h.push.mock.calls[0][0]).toBe("/marketplace");
  });
});
