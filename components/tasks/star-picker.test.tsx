// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import { StarPicker } from "./star-picker";

afterEach(cleanup);

describe("StarPicker", () => {
  it("renders five star radios and a prompt when unset", () => {
    render(<StarPicker value={0} onChange={() => {}} />);
    expect(screen.getAllByRole("radio")).toHaveLength(5);
    expect(screen.getByText("Tap to rate")).toBeTruthy();
  });

  it("calls onChange with the clicked star's value", () => {
    const onChange = vi.fn();
    render(<StarPicker value={0} onChange={onChange} />);
    fireEvent.click(screen.getByRole("radio", { name: "4 stars" }));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("marks the active rating and shows its label", () => {
    render(<StarPicker value={4} onChange={() => {}} />);
    expect(screen.getByRole("radio", { name: "4 stars", checked: true })).toBeTruthy();
    expect(screen.getByText("4 · Great")).toBeTruthy();
  });

  it("uses the singular form for a one-star label", () => {
    render(<StarPicker value={1} onChange={() => {}} />);
    expect(screen.getByRole("radio", { name: "1 star" })).toBeTruthy();
    expect(screen.getByText("1 · Poor")).toBeTruthy();
  });
});
