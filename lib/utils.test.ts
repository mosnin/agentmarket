import { describe, it, expect } from "vitest";

import {
  formatCurrency,
  formatPercent,
  formatRating,
  formatNumber,
  formatLatency,
  formatCompact,
  formatRelativeTime,
  slugify,
  initials,
  truncate,
  pluralize,
  mockHash,
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

describe("slugify", () => {
  it("lowercases and hyphenates words", () => {
    expect(slugify("Growth Research Agent")).toBe("growth-research-agent");
  });
  it("strips punctuation and collapses whitespace runs", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
    expect(slugify("multiple   spaces")).toBe("multiple-spaces");
  });
  it("removes underscores (treated as punctuation, not separators)", () => {
    expect(slugify("snake_case")).toBe("snakecase");
  });
  it("trims surrounding whitespace and stray separators", () => {
    expect(slugify("  Trim  Me  ")).toBe("trim-me");
    expect(slugify("--Edge--")).toBe("edge");
  });
});

describe("initials", () => {
  it("takes the first letter of up to two words, uppercased", () => {
    expect(initials("Ada Lovelace")).toBe("AL");
    expect(initials("Growth Research Agent")).toBe("GR");
    expect(initials("madonna")).toBe("M");
  });
  it("returns an empty string for an empty name", () => {
    expect(initials("")).toBe("");
  });
});

describe("truncate", () => {
  it("leaves short strings untouched", () => {
    expect(truncate("short", 120)).toBe("short");
  });
  it("clips past the limit and appends an ellipsis (trimming trailing space)", () => {
    expect(truncate("hello world", 5)).toBe("hello…");
    expect(truncate("hello world", 6)).toBe("hello…");
  });
});

describe("pluralize", () => {
  it("uses the singular only for a count of one", () => {
    expect(pluralize(1, "task")).toBe("task");
    expect(pluralize(0, "task")).toBe("tasks");
    expect(pluralize(2, "task")).toBe("tasks");
  });
  it("honors an explicit plural form", () => {
    expect(pluralize(2, "entity", "entities")).toBe("entities");
    expect(pluralize(1, "entity", "entities")).toBe("entity");
  });
});

describe("mockHash", () => {
  it("is stable for a given seed and carries the prefix", () => {
    expect(mockHash("0x", "seed")).toBe(mockHash("0x", "seed"));
    expect(mockHash("0x", "seed")).toMatch(/^0x[0-9a-f]+$/);
    expect(mockHash("tx_", "seed").startsWith("tx_")).toBe(true);
  });
  it("differs for different seeds", () => {
    expect(mockHash("0x", "a")).not.toBe(mockHash("0x", "b"));
  });
});
