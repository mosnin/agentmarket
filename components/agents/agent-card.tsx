import Link from "next/link";
import { BadgeCheck, Building2, Clock, Star } from "lucide-react";

import type { AgentCardData } from "@/lib/data";
import { CATEGORY_META, type Category } from "@/lib/constants";
import { cn, formatRateOrDash, formatLatency, formatRating } from "@/lib/utils";
import { formatAgentPrice } from "@/lib/pricing";

import { buttonVariants } from "@/components/ui/button";
import { CategoryIcon } from "@/components/shared/category-icon";
import { CapabilityBadge } from "@/components/agents/capability-badge";
import { ReputationScore } from "@/components/agents/reputation-score";

const MAX_CAPABILITIES = 3;

export function AgentCard({ agent }: { agent: AgentCardData }) {
  const categoryMeta = CATEGORY_META[agent.category as Category];
  const capabilities = agent.capabilities.map((c) => c.capability.name);
  const shownCapabilities = capabilities.slice(0, MAX_CAPABILITIES);
  const extraCapabilities = capabilities.length - shownCapabilities.length;

  const { label: priceLabel } = formatAgentPrice(agent);

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-4 rounded-2xl border border-border bg-card p-5",
        "transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-border/80 hover:bg-card/80 hover:shadow-lg hover:shadow-black/20",
        "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40",
      )}
    >
      {/* The whole card opens the agent's profile (stretched link). Secondary
          actions below sit above it via relative z-10. */}
      <Link
        href={`/agents/${agent.slug}`}
        className="absolute inset-0 z-0 rounded-2xl outline-none"
        aria-label={`View ${agent.name}'s profile`}
      />

      {/* Header: icon tile + name/category, reputation ring on the right */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl",
              categoryMeta?.iconBg ?? "bg-muted",
            )}
          >
            <CategoryIcon
              category={agent.category}
              className={cn("size-5", categoryMeta?.iconText ?? "text-muted-foreground")}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-base font-semibold text-foreground">
                {agent.name}
              </h3>
              {agent.verified ? (
                <BadgeCheck
                  className="size-4 shrink-0 text-brand"
                  aria-label="Verified agent"
                />
              ) : null}
            </div>
            <span
              className={cn(
                "mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                categoryMeta?.chip ?? "border-border bg-muted text-muted-foreground",
              )}
            >
              {agent.category}
            </span>
          </div>
        </div>
        <ReputationScore score={agent.reputationScore} size="sm" className="shrink-0" />
      </div>

      {/* Description */}
      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {agent.shortDescription}
      </p>

      {/* Capabilities */}
      {capabilities.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {shownCapabilities.map((name) => (
            <CapabilityBadge key={name} label={name} />
          ))}
          {extraCapabilities > 0 ? (
            <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
              +{extraCapabilities} more
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Metrics row */}
      <div className="mt-auto flex items-center gap-4 border-t border-border/60 pt-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Star className="size-3.5 fill-warning text-warning" aria-hidden="true" />
          <span className="font-medium tabular-nums text-foreground">
            {agent.averageRating > 0 ? formatRating(agent.averageRating) : "New"}
          </span>
        </span>
        <span className="inline-flex items-center gap-1" title="Completion rate">
          <span className="font-medium tabular-nums text-foreground">
            {formatRateOrDash(agent.completionRate, agent._count.tasks)}
          </span>
          <span>completion</span>
        </span>
        <span className="inline-flex items-center gap-1" title="Average latency">
          <Clock className="size-3.5" aria-hidden="true" />
          <span className="font-medium tabular-nums text-foreground">
            {formatLatency(agent.averageLatencyMinutes)}
          </span>
        </span>
      </div>

      {/* Footer: org + price + a one-tap Hire that deep-links to a contract
          pre-filled with this agent (raised above the stretched link). */}
      <div className="flex items-end justify-between gap-3">
        {agent.organization?.name ? (
          <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{agent.organization.name}</span>
          </span>
        ) : (
          <span />
        )}
        <div className="flex shrink-0 items-center gap-2.5">
          <span className="text-sm font-semibold tabular-nums text-foreground">{priceLabel}</span>
          <Link
            href={`/tasks/new?agent=${agent.slug}`}
            className={cn(
              buttonVariants({ size: "sm", variant: "outline" }),
              "relative z-10",
            )}
            aria-label={`Hire ${agent.name}`}
          >
            Hire
          </Link>
        </div>
      </div>
    </div>
  );
}
