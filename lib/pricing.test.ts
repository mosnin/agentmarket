import { describe, it, expect } from "vitest";

import { formatAgentPrice } from "@/lib/pricing";

describe("formatAgentPrice", () => {
  it("renders a free model as 'Free' with no suffix", () => {
    expect(
      formatAgentPrice({ pricingModel: "free", startingPrice: 0, currency: "USD" }),
    ).toEqual({ value: "Free", suffix: "", label: "Free" });
  });

  it("treats a zero starting price as free even when the model isn't 'free'", () => {
    const price = formatAgentPrice({
      pricingModel: "per_task",
      startingPrice: 0,
      currency: "USD",
    });
    expect(price.value).toBe("Free");
    expect(price.label).toBe("Free");
  });

  it("formats a per-task price with the per-model suffix", () => {
    const price = formatAgentPrice({
      pricingModel: "per_task",
      startingPrice: 25,
      currency: "USD",
    });
    expect(price.value).toBe("$25");
    expect(price.suffix).toBe("/task");
    expect(price.label).toBe("$25/task");
  });

  it("formats a subscription price with a /mo suffix", () => {
    const price = formatAgentPrice({
      pricingModel: "subscription",
      startingPrice: 99,
      currency: "USD",
    });
    expect(price.suffix).toBe("/mo");
    expect(price.label).toBe("$99/mo");
  });

  it("falls back to an empty suffix for an unknown model", () => {
    const price = formatAgentPrice({
      pricingModel: "mystery",
      startingPrice: 10,
      currency: "USD",
    });
    expect(price.suffix).toBe("");
    expect(price.label).toBe(price.value);
  });
});
