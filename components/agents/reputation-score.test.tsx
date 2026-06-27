// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { ReputationScore } from "./reputation-score";

afterEach(cleanup);

describe("ReputationScore", () => {
  it("renders the score with a descriptive title", () => {
    render(<ReputationScore score={92} />);
    expect(screen.getByText("92")).toBeTruthy();
    expect(screen.getByTitle("Reputation 92/100")).toBeTruthy();
  });

  it("clamps and rounds out-of-range / fractional scores", () => {
    render(<ReputationScore score={150} />);
    expect(screen.getByText("100")).toBeTruthy();
    cleanup();
    render(<ReputationScore score={-10} />);
    expect(screen.getByText("0")).toBeTruthy();
    cleanup();
    render(<ReputationScore score={84.6} />);
    expect(screen.getByText("85")).toBeTruthy();
  });

  it("colours the score by tier band", () => {
    const cases: [number, string][] = [
      [92, "text-emerald-400"],
      [85, "text-lime-400"],
      [72, "text-amber-400"],
      [50, "text-rose-400"],
    ];
    for (const [score, cls] of cases) {
      cleanup();
      render(<ReputationScore score={score} />);
      expect(screen.getByText(String(score)).className).toContain(cls);
    }
  });

  it("renders the optional label", () => {
    render(<ReputationScore score={92} showLabel />);
    expect(screen.getByText("Reputation")).toBeTruthy();
    expect(screen.getByText("92 / 100 rep")).toBeTruthy();
  });
});
