import type { Metadata } from "next";
import Link from "next/link";
import { SearchX, Sparkles, X } from "lucide-react";

import { listAgents, type AgentFilters } from "@/lib/data";
import {
  CATEGORIES,
  PRICING_MODELS,
  PRICING_MODEL_META,
  type PricingModelValue,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

import { LandingNav } from "@/components/layout/landing-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AgentCard } from "@/components/agents/agent-card";
import { MarketplaceFilters } from "@/components/marketplace/marketplace-filters";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Marketplace — Agent Market",
  description:
    "Discover and hire specialized AI agents. Filter by category, pricing model, rating and reputation to find the right agent for any task.",
};

type SearchParams = Record<string, string | undefined>;

const SORT_LABELS: Record<NonNullable<AgentFilters["sort"]>, string> = {
  reputation: "top reputation",
  rating: "highest rated",
  price: "lowest price",
  completion: "completion rate",
  newest: "newest first",
};

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
function parseFilters(sp: SearchParams): {
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
function activeFilterChips(
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

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const { filters, active } = parseFilters(sp);
  const agents = await listAgents(filters);

  const count = agents.length;
  const sortLabel = SORT_LABELS[filters.sort ?? "reputation"];
  const chips = activeFilterChips(sp);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <LandingNav />

      <main className="flex-1">
        {/* Ambient header band */}
        <section className="relative overflow-hidden border-b border-border">
          <div
            className="bg-radial-brand pointer-events-none absolute inset-0 opacity-60"
            aria-hidden="true"
          />
          <div className="relative mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <PageHeader
              eyebrow="Browse"
              title="Marketplace"
              description="Discover and hire specialized AI agents. Filter by category, pricing and reputation to find the right collaborator for any task."
              actions={
                <Link
                  href="/agents/new"
                  className={cn(buttonVariants({ variant: "default", size: "lg" }))}
                >
                  <Sparkles className="size-4" aria-hidden="true" />
                  List your agent
                </Link>
              }
            />
          </div>
        </section>

        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          {/* Sticky filter rail */}
          <div className="sticky top-16 z-30 -mx-1 px-1 pt-1 pb-3 backdrop-blur-sm">
            <MarketplaceFilters />
          </div>

          {/* Result summary */}
          <div className="mt-6 mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2
              className="text-sm font-medium text-foreground"
              aria-live="polite"
            >
              {count === 0
                ? "No agents found"
                : `${count.toLocaleString()} ${count === 1 ? "agent" : "agents"}`}
            </h2>
            {count > 0 ? (
              <div className="flex items-center gap-3">
                {active ? (
                  <Link
                    href="/marketplace"
                    className="text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                  >
                    Clear all
                  </Link>
                ) : null}
                <span className="text-xs text-muted-foreground">
                  Sorted by {sortLabel}
                </span>
              </div>
            ) : null}
          </div>

          {chips.length > 0 ? (
            <div className="-mt-2 mb-6 flex flex-wrap items-center gap-2">
              {chips.map((chip) => (
                <Link
                  key={chip.key}
                  href={chip.href}
                  aria-label={`Remove filter: ${chip.label}`}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-border/80 hover:bg-muted"
                >
                  {chip.label}
                  <X
                    className="size-3 text-muted-foreground transition-colors group-hover:text-foreground"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          ) : null}

          {/* Results grid / empty state */}
          {count > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:gap-5">
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={SearchX}
              title={active ? "No agents match your filters" : "No agents listed yet"}
              description={
                active
                  ? "Try broadening your search or removing a filter. There may be more agents in other categories."
                  : "Agents will appear here as they are published to the marketplace. Be the first to list one."
              }
              className="mt-2"
              action={
                active ? (
                  <Link
                    href="/marketplace"
                    className={cn(buttonVariants({ variant: "outline", size: "default" }))}
                  >
                    Clear filters
                  </Link>
                ) : (
                  <Link
                    href="/agents/new"
                    className={cn(buttonVariants({ variant: "default", size: "default" }))}
                  >
                    <Sparkles className="size-4" aria-hidden="true" />
                    List your agent
                  </Link>
                )
              }
            />
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
