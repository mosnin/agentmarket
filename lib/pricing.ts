import { PRICING_MODEL_META, type PricingModelValue } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

/** The pricing fields every hire surface needs to render a price. */
export interface AgentPricing {
  pricingModel: string;
  startingPrice: number;
  currency: string;
}

/**
 * One source of truth for how an agent's price reads across the marketplace
 * (card, profile header, detail page, seller studio). A free model — or a zero
 * starting price — renders "Free"; otherwise it's the formatted currency plus the
 * per-model suffix (e.g. "/task", "/mo"). Returns the parts separately (`value` +
 * `suffix`, styled differently in some layouts) plus a combined `label`.
 */
export function formatAgentPrice(agent: AgentPricing): {
  value: string;
  suffix: string;
  label: string;
} {
  if (agent.pricingModel === "free" || agent.startingPrice === 0) {
    return { value: "Free", suffix: "", label: "Free" };
  }
  const value = formatCurrency(agent.startingPrice, agent.currency);
  const suffix =
    PRICING_MODEL_META[agent.pricingModel as PricingModelValue]?.suffix ?? "";
  return { value, suffix, label: `${value}${suffix}` };
}
