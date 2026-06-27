import { describe, it, expect } from "vitest";

import { parseFilters, activeFilterChips } from "./filters";
import { CATEGORIES, PRICING_MODELS } from "@/lib/constants";

const category = CATEGORIES[0];
const pricing = PRICING_MODELS[0];

describe("parseFilters", () => {
  it("returns empty + inactive for no params", () => {
    expect(parseFilters({})).toEqual({ filters: {}, active: false });
  });

  it("trims the search term and marks the query active", () => {
    const { filters, active } = parseFilters({ q: "  research  " });
    expect(filters.search).toBe("research");
    expect(active).toBe(true);
  });

  it("keeps a known category/pricing and drops unknown ones", () => {
    expect(parseFilters({ category, pricing }).filters).toMatchObject({
      category,
      pricingModel: pricing,
    });
    const dropped = parseFilters({ category: "Nope", pricing: "barter" }).filters;
    expect(dropped.category).toBeUndefined();
    expect(dropped.pricingModel).toBeUndefined();
  });

  it("parses a positive rating and drops zero / non-numeric", () => {
    expect(parseFilters({ rating: "4.5" }).filters.minRating).toBe(4.5);
    expect(parseFilters({ rating: "0" }).filters.minRating).toBeUndefined();
    expect(parseFilters({ rating: "abc" }).filters.minRating).toBeUndefined();
  });

  it("treats verified only when exactly 'true'", () => {
    expect(parseFilters({ verified: "true" }).filters.verified).toBe(true);
    expect(parseFilters({ verified: "false" }).filters.verified).toBeUndefined();
  });

  it("accepts a valid sort and drops an unknown one", () => {
    expect(parseFilters({ sort: "rating" }).filters.sort).toBe("rating");
    expect(parseFilters({ sort: "bogus" }).filters.sort).toBeUndefined();
  });
});

describe("activeFilterChips", () => {
  it("returns no chips when nothing is set", () => {
    expect(activeFilterChips({})).toEqual([]);
  });

  it("builds a chip per active filter", () => {
    const chips = activeFilterChips({ q: "leads", category, verified: "true" });
    expect(chips.map((c) => c.key)).toEqual(["q", "category", "verified"]);
  });

  it("removing one filter preserves the others in the href", () => {
    const chips = activeFilterChips({ category, pricing });
    const categoryChip = chips.find((c) => c.key === "category")!;
    // The category chip's href drops `category` but keeps `pricing`.
    expect(categoryChip.href).toContain(`pricing=${pricing}`);
    expect(categoryChip.href).not.toContain("category=");
  });

  it("links to a bare /marketplace when removing the only filter", () => {
    const chips = activeFilterChips({ q: "solo" });
    expect(chips[0].href).toBe("/marketplace");
  });

  it("ignores an unknown category (no chip)", () => {
    expect(activeFilterChips({ category: "Nope" })).toEqual([]);
  });
});
