import {
  CATEGORIES,
  PRICING_MODELS,
  PRICING_MODEL_META,
  type PricingModelValue,
} from "@/lib/constants";
import type { AgentFilters } from "@/lib/data";

/** The marketplace URL query, owned by MarketplaceFilters. */
export type SearchParams = Record<string, string | undefined>;

const VALID_SORTS = new Set<NonNullable<AgentFilters["sort"]>>([
  "reputation",
  "rating",
  "price",
  "completion",
  "newest",
]);

/**
 * Translate the URL query string (owned by MarketplaceFilters) into the typed
 * AgentFilters shape that lib/data#listAgents expects. Unknown/blank values are
 * dropped so the server query stays clean and the filters round-trip cleanly.
 */
export function parseFilters(sp: SearchParams): {
  filters: AgentFilters;
  active: boolean;
} {
  const filters: AgentFilters = {};

  const search = sp.q?.trim();
  if (search) filters.search = search;

  const category = sp.category?.trim();
  if (category && (CATEGORIES as readonly string[]).includes(category)) {
    filters.category = category;
  }

  const pricing = sp.pricing?.trim();
  if (pricing && (PRICING_MODELS as readonly string[]).includes(pricing)) {
    filters.pricingModel = pricing;
  }

  const ratingRaw = sp.rating?.trim();
  if (ratingRaw) {
    const parsed = Number.parseFloat(ratingRaw);
    if (Number.isFinite(parsed) && parsed > 0) filters.minRating = parsed;
  }

  if (sp.verified === "true") filters.verified = true;

  const sort = sp.sort?.trim();
  if (sort && VALID_SORTS.has(sort as NonNullable<AgentFilters["sort"]>)) {
    filters.sort = sort as NonNullable<AgentFilters["sort"]>;
  }

  const active = Object.keys(filters).length > 0;
  return { filters, active };
}

/** Active filters as removable chips — each links to the query minus that one. */
export function activeFilterChips(
  sp: SearchParams,
): { key: string; label: string; href: string }[] {
  const omitHref = (omit: string) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      if (k === omit || !v) continue;
      params.set(k, v);
    }
    const qs = params.toString();
    return qs ? `/marketplace?${qs}` : "/marketplace";
  };

  const chips: { key: string; label: string; href: string }[] = [];
  const search = sp.q?.trim();
  if (search) chips.push({ key: "q", label: `“${search}”`, href: omitHref("q") });

  const category = sp.category?.trim();
  if (category && (CATEGORIES as readonly string[]).includes(category)) {
    chips.push({ key: "category", label: category, href: omitHref("category") });
  }

  const pricing = sp.pricing?.trim();
  if (pricing && (PRICING_MODELS as readonly string[]).includes(pricing)) {
    chips.push({
      key: "pricing",
      label: PRICING_MODEL_META[pricing as PricingModelValue]?.label ?? pricing,
      href: omitHref("pricing"),
    });
  }

  const ratingRaw = sp.rating?.trim();
  if (ratingRaw) {
    const parsed = Number.parseFloat(ratingRaw);
    if (Number.isFinite(parsed) && parsed > 0) {
      chips.push({
        key: "rating",
        label: `${parsed.toFixed(1)}+ rating`,
        href: omitHref("rating"),
      });
    }
  }

  if (sp.verified === "true") {
    chips.push({ key: "verified", label: "Verified only", href: omitHref("verified") });
  }

  return chips;
}
