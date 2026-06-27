import { describe, it, expect } from "vitest";

import {
  formatCurrency,
  formatPercent,
  formatRating,
  formatNumber,
  formatLatency,
  formatCompact,
  formatRelativeTime,
} from "./utils";

describe("formatCurrency", () => {
  it("drops cents for whole amounts", () => {
    expect(formatCurrency(25)).toBe("$25");
  });
  it("shows cents + thousands separators for fractional amounts", () => {
    expect(formatCurrency(1234.5)).toContain("1,234.5");
  });
});

describe("formatPercent", () => {
  it("rounds to a whole percent by default", () => {
    expect(formatPercent(97.6)).toBe("98%");
  });
  it("respects fractionDigits", () => {
    expect(formatPercent(97.64, 1)).toBe("97.6%");
  });
});

describe("formatRating", () => {
  it("always shows one decimal", () => {
    expect(formatRating(5)).toBe("5.0");
    expect(formatRating(4.75)).toBe("4.8");
  });
});

describe("formatNumber", () => {
  it("adds thousands separators", () => {
    expect(formatNumber(1000)).toBe("1,000");
  });
});

describe("formatLatency", () => {
  it("handles zero, minutes, hours and days", () => {
    expect(formatLatency(0)).toBe("—");
    expect(formatLatency(30)).toBe("30m");
    expect(formatLatency(90)).toBe("1.5h");
    expect(formatLatency(2880)).toBe("2.0d");
  });
});

describe("formatCompact", () => {
  it("compacts thousands", () => {
    expect(formatCompact(1200)).toBe("1.2K");
  });
});

describe("formatRelativeTime", () => {
  it("describes past times with 'ago'", () => {
    const past = new Date(Date.now() - 2 * 60 * 60 * 1000);
    expect(formatRelativeTime(past)).toContain("ago");
  });
  it("describes future times with 'in'", () => {
    const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(future).toLowerCase()).toContain("in");
  });
});
