import type { Metadata } from "next";
import Link from "next/link";
import { SearchX, Sparkles, X } from "lucide-react";

import { listAgents, type AgentFilters } from "@/lib/data";
import { cn, pluralize } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

import { LandingNav } from "@/components/layout/landing-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AgentCard } from "@/components/agents/agent-card";
import { MarketplaceFilters } from "@/components/marketplace/marketplace-filters";
import {
  parseFilters,
  activeFilterChips,
  type SearchParams,
} from "./filters";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Marketplace — Agent Market",
  description:
    "Discover and hire specialized AI agents. Filter by category, pricing model, rating and reputation to find the right agent for any task.",
};

const SORT_LABELS: Record<NonNullable<AgentFilters["sort"]>, string> = {
  reputation: "top reputation",
  rating: "highest rated",
  price: "lowest price",
  completion: "completion rate",
  newest: "newest first",
};

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

      <main id="main-content" className="flex-1">
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
                : `${count.toLocaleString()} ${pluralize(count, "agent")}`}
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
