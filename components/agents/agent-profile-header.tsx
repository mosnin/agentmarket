import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, CheckCircle2, Star } from "lucide-react";

import type { AgentDetailData } from "@/lib/data";
import {
  CATEGORY_META,
  PRICING_MODEL_META,
  type Category,
  type PricingModelValue,
} from "@/lib/constants";
import { buttonVariants } from "@/components/ui/button";
import {
  cn,
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRating,
} from "@/lib/utils";

import { CategoryIcon } from "@/components/shared/category-icon";
import { ReputationScore } from "@/components/agents/reputation-score";

/**
 * Tier-derived standing label. Thresholds mirror `tierFor` in
 * reputation-score.tsx so the descriptor matches the ring's color tier.
 */
function standingLabel(score: number): string {
  if (score >= 90) return "Top-tier standing";
  if (score >= 80) return "Strong standing";
  if (score >= 70) return "Established";
  return "Building reputation";
}

function StatChip({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/30 px-3 py-2">
      <span className="text-muted-foreground">{icon}</span>
      <div className="leading-tight">
        <div className="text-sm font-semibold text-foreground">{value}</div>
        <div className="text-[11px] text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

export function AgentProfileHeader({ agent }: { agent: AgentDetailData }) {
  const categoryMeta = CATEGORY_META[agent.category as Category];
  const pricingMeta = PRICING_MODEL_META[agent.pricingModel as PricingModelValue];

  const priceLabel =
    agent.pricingModel === "free"
      ? "Free"
      : formatCurrency(agent.startingPrice, agent.currency);
  const priceSuffix = agent.pricingModel === "free" ? "" : (pricingMeta?.suffix ?? "");

  return (
    <header className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-radial-brand opacity-60" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        {/* Left: identity */}
        <div className="flex min-w-0 items-start gap-4 sm:gap-5">
          <div
            className={cn(
              "flex size-16 shrink-0 items-center justify-center rounded-2xl sm:size-20",
              categoryMeta?.iconBg ?? "bg-muted",
            )}
          >
            <CategoryIcon
              category={agent.category}
              className={cn(
                "size-8 sm:size-9",
                categoryMeta?.iconText ?? "text-muted-foreground",
              )}
            />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {agent.name}
              </h1>
              {agent.verified ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                  <BadgeCheck className="size-3.5" aria-hidden="true" />
                  Verified
                </span>
              ) : null}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  categoryMeta?.chip ?? "border-border bg-muted text-muted-foreground",
                )}
              >
                <CategoryIcon category={agent.category} className="size-3.5" />
                {agent.category}
              </span>
              {agent.organization?.name ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building2 className="size-3.5" aria-hidden="true" />
                  {agent.organization.name}
                </span>
              ) : null}
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {agent.shortDescription}
            </p>

            {/* Stat chips */}
            <div className="mt-5 flex flex-wrap gap-2.5">
              <StatChip
                icon={
                  <Star
                    className="size-4 fill-amber-400 text-amber-400"
                    aria-hidden="true"
                  />
                }
                value={agent.averageRating > 0 ? formatRating(agent.averageRating) : "New"}
                label={`${formatNumber(agent._count.reviews)} reviews`}
              />
              <StatChip
                icon={<CheckCircle2 className="size-4" aria-hidden="true" />}
                value={formatPercent(agent.completionRate)}
                label="Completion rate"
              />
              <StatChip
                icon={<ArrowRight className="size-4" aria-hidden="true" />}
                value={formatNumber(agent.totalTasksCompleted)}
                label="Tasks completed"
              />
            </div>
          </div>
        </div>

        {/* Right: reputation, pricing, CTA */}
        <div className="flex shrink-0 flex-col gap-5 lg:items-end">
          <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-muted/30 p-4 lg:justify-end">
            <ReputationScore score={agent.reputationScore} size="lg" />
            <div className="leading-tight">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Reputation
              </div>
              <div className="text-sm font-medium text-foreground">
                {standingLabel(agent.reputationScore)}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            <div className="flex items-baseline gap-1.5 lg:justify-end">
              <span className="text-2xl font-bold text-foreground">{priceLabel}</span>
              {priceSuffix ? (
                <span className="text-sm text-muted-foreground">{priceSuffix}</span>
              ) : null}
              <span className="ml-1 text-xs text-muted-foreground">
                · {pricingMeta?.label ?? "Custom pricing"}
              </span>
            </div>
            <Link
              href={`/tasks/new?agent=${agent.id}`}
              className={cn(buttonVariants({ size: "lg" }), "w-full lg:w-auto")}
            >
              Hire this agent
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
