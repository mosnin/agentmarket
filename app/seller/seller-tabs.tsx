"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bot,
  CheckCircle2,
  GitPullRequestArrow,
  Inbox,
  MessageSquareQuote,
  Pencil,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";

import type { TaskListItem } from "@/lib/data";
import { PRICING_MODEL_META, type PricingModelValue } from "@/lib/constants";
import {
  cn,
  formatCurrency,
  formatPercent,
  formatRating,
} from "@/lib/utils";
import { RelativeTime } from "@/components/shared/relative-time";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { EmptyState } from "@/components/shared/empty-state";
import { CategoryIcon } from "@/components/shared/category-icon";
import { ReputationScore } from "@/components/agents/reputation-score";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { PaymentStatusBadge } from "@/components/tasks/payment-status-badge";
import { ReviewCard } from "@/components/tasks/review-card";

import { AgentStatusBadge } from "./agent-status-badge";

/* ---------------------------------- Types --------------------------------- */

/** A seller-owned agent with capabilities + counts, as returned by getSellerData. */
export type SellerAgent = {
  id: string;
  name: string;
  slug: string;
  category: string;
  status: string;
  verified: boolean;
  pricingModel: string;
  startingPrice: number;
  currency: string;
  reputationScore: number;
  averageRating: number;
  completionRate: number;
  disputeRate: number;
  schemaComplianceScore: number;
  averageLatencyMinutes: number;
  totalTasksCompleted: number;
  capabilities: { capability: { id: string; name: string } }[];
  _count: { tasks: number; reviews: number };
};

export type SellerReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date | string;
  user: { name: string | null; email: string | null } | null;
  agent: { name: string } | null;
  task: { id: string; title: string } | null;
};

interface SellerTabsProps {
  agents: SellerAgent[];
  inboundTasks: TaskListItem[];
  openInboundIds: string[];
  reviews: SellerReview[];
}

function pricingSuffix(model: string): string {
  return PRICING_MODEL_META[model as PricingModelValue]?.suffix ?? "";
}

function priceLabel(agent: Pick<SellerAgent, "pricingModel" | "startingPrice" | "currency">) {
  if (agent.pricingModel === "free" || agent.startingPrice === 0) {
    return { value: "Free", suffix: "" };
  }
  return {
    value: formatCurrency(agent.startingPrice, agent.currency),
    suffix: pricingSuffix(agent.pricingModel),
  };
}

/* --------------------------------- Shell ---------------------------------- */

/**
 * Card wrapper for a tab panel. Keeps the four panels visually consistent and
 * provides a header row with an optional right-aligned action.
 */
function PanelCard({
  title,
  description,
  count,
  action,
  children,
}: {
  title: string;
  description: string;
  count?: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-sm font-semibold tracking-tight text-foreground">
              {title}
            </h2>
            {typeof count === "number" ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium tabular-nums text-muted-foreground">
                {count}
              </span>
            ) : null}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </div>
  );
}

/** Compact agent identity cell: category tile + name (linked) + capability hint. */
function AgentIdentity({ agent }: { agent: SellerAgent }) {
  const topCaps = agent.capabilities.slice(0, 2).map((c) => c.capability.name);
  const extra = agent.capabilities.length - topCaps.length;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 ring-1 ring-border">
        <CategoryIcon category={agent.category} className="size-4 text-muted-foreground" />
      </span>
      <div className="min-w-0">
        <Link
          href={`/agents/${agent.slug}`}
          className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground transition-colors hover:text-brand"
        >
          <span className="truncate">{agent.name}</span>
          {agent.verified ? (
            <ShieldCheck
              className="size-3.5 shrink-0 text-brand"
              aria-label="Verified agent"
            />
          ) : null}
        </Link>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {topCaps.length > 0 ? (
            <>
              {topCaps.join(", ")}
              {extra > 0 ? ` +${extra}` : ""}
            </>
          ) : (
            <span className="italic">No capabilities listed</span>
          )}
        </p>
      </div>
    </div>
  );
}

/* -------------------------------- Listings -------------------------------- */

function ListingsPanel({ agents }: { agents: SellerAgent[] }) {
  if (agents.length === 0) {
    return (
      <PanelCard
        title="Listings"
        description="The agents you operate on the marketplace."
      >
        <div className="p-5">
          <EmptyState
            icon={Bot}
            title="No agents listed yet"
            description="List your first specialist to start receiving inbound tasks and earning on Agent Market."
            className="border-0 bg-transparent py-12"
            action={
              <Link
                href="/agents/new"
                className={cn(buttonVariants({ variant: "default", size: "sm" }))}
              >
                <Plus className="size-3.5" aria-hidden="true" />
                List an agent
              </Link>
            }
          />
        </div>
      </PanelCard>
    );
  }

  return (
    <PanelCard
      title="Listings"
      description="The agents you operate on the marketplace."
      count={agents.length}
      action={
        <Link
          href="/agents/new"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <Plus className="size-3.5" aria-hidden="true" />
          New agent
        </Link>
      }
    >
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-5">Agent</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Reputation</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Tasks</TableHead>
            <TableHead className="pr-5 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agents.map((agent) => {
            const price = priceLabel(agent);
            return (
              <TableRow key={agent.id} className="group">
                <TableCell className="max-w-[260px] py-3 pl-5">
                  <AgentIdentity agent={agent} />
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CategoryIcon
                      category={agent.category}
                      className="size-3.5 text-muted-foreground"
                    />
                    {agent.category}
                  </span>
                </TableCell>
                <TableCell>
                  <AgentStatusBadge status={agent.status} />
                </TableCell>
                <TableCell>
                  <div className="flex justify-center">
                    <ReputationScore score={agent.reputationScore} size="sm" />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-sm font-medium tabular-nums text-foreground">
                    {price.value}
                  </span>
                  {price.suffix ? (
                    <span className="text-xs text-muted-foreground">{price.suffix}</span>
                  ) : null}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                  {agent._count.tasks}
                </TableCell>
                <TableCell className="pr-5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      href={`/agents/${agent.slug}/edit`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      <Pencil className="size-3.5" aria-hidden="true" />
                      Edit
                    </Link>
                    <Link
                      href={`/agents/${agent.slug}`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      View
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </PanelCard>
  );
}

/* ------------------------------ Inbound tasks ----------------------------- */

function buyerName(task: TaskListItem): string {
  return task.buyer?.name?.trim() || task.buyer?.email?.trim() || "Unknown buyer";
}

function InboundTasksPanel({
  tasks,
  openIds,
}: {
  tasks: TaskListItem[];
  openIds: Set<string>;
}) {
  if (tasks.length === 0) {
    return (
      <PanelCard
        title="Inbound tasks"
        description="Work routed to your agents by other operators."
      >
        <div className="p-5">
          <EmptyState
            icon={Inbox}
            title="No inbound tasks yet"
            description="When buyers commission your agents, those tasks land here for you to track from acceptance through payout."
            className="border-0 bg-transparent py-12"
            action={
              <Link
                href="/marketplace"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                <Sparkles className="size-3.5" aria-hidden="true" />
                Promote your agents
              </Link>
            }
          />
        </div>
      </PanelCard>
    );
  }

  return (
    <PanelCard
      title="Inbound tasks"
      description="Work routed to your agents — open items are highlighted and need attention."
      count={tasks.length}
      action={
        openIds.size > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
            <span className="size-1.5 animate-pulse rounded-full bg-amber-400" aria-hidden />
            {openIds.size} open
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            All settled
          </span>
        )
      }
    >
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-5">Task</TableHead>
            <TableHead>Agent</TableHead>
            <TableHead>Buyer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead className="text-right">Budget</TableHead>
            <TableHead className="pr-5 text-right">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const isOpen = openIds.has(task.id);
            return (
              <TableRow
                key={task.id}
                className={cn(
                  "group relative",
                  isOpen && "bg-amber-500/[0.04] hover:bg-amber-500/[0.08]",
                )}
              >
                <TableCell className="max-w-[280px] py-3 pl-5">
                  <Link href={`/tasks/${task.id}`} className="group/link flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg ring-1",
                        isOpen
                          ? "bg-amber-500/10 ring-amber-500/20"
                          : "bg-muted/60 ring-border",
                      )}
                    >
                      <CategoryIcon
                        category={task.category}
                        className={cn(
                          "size-4",
                          isOpen ? "text-amber-400" : "text-muted-foreground",
                        )}
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground transition-colors group-hover/link:text-brand">
                        {task.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {task.category}
                      </p>
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="max-w-[160px]">
                  {task.sellerAgent ? (
                    <Link
                      href={`/agents/${task.sellerAgent.slug}`}
                      className="truncate text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {task.sellerAgent.name}
                    </Link>
                  ) : (
                    <span className="text-sm italic text-muted-foreground">Unassigned</span>
                  )}
                </TableCell>
                <TableCell className="max-w-[160px]">
                  <span className="truncate text-sm text-muted-foreground">
                    {buyerName(task)}
                  </span>
                </TableCell>
                <TableCell>
                  <TaskStatusBadge status={task.status} />
                </TableCell>
                <TableCell>
                  {task.payment ? (
                    <PaymentStatusBadge status={task.payment.status} />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right text-sm font-medium tabular-nums text-foreground">
                  {formatCurrency(task.budget, task.currency)}
                </TableCell>
                <TableCell className="pr-5 text-right text-xs whitespace-nowrap text-muted-foreground">
                  <RelativeTime date={task.createdAt} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </PanelCard>
  );
}

/* --------------------------------- Reviews -------------------------------- */

function ReviewsPanel({ reviews }: { reviews: SellerReview[] }) {
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  if (reviews.length === 0) {
    return (
      <PanelCard
        title="Reviews"
        description="Feedback buyers leave after your agents complete a task."
      >
        <div className="p-5">
          <EmptyState
            icon={MessageSquareQuote}
            title="No reviews yet"
            description="Reviews appear here as your agents complete tasks. Strong ratings lift your reputation and ranking in the marketplace."
            className="border-0 bg-transparent py-12"
          />
        </div>
      </PanelCard>
    );
  }

  return (
    <PanelCard
      title="Reviews"
      description="Feedback buyers leave after your agents complete a task."
      count={reviews.length}
      action={
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
          <Star className="size-3.5 fill-amber-400" aria-hidden="true" />
          {formatRating(averageRating)} avg
        </span>
      }
    >
      <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2">
        {reviews.map((review) => (
          <div key={review.id} className="flex flex-col gap-2">
            <ReviewCard review={review} />
            {(review.agent?.name || review.task) ? (
              <p className="px-1 text-xs text-muted-foreground">
                {review.agent?.name ? (
                  <span className="text-foreground/80">{review.agent.name}</span>
                ) : null}
                {review.agent?.name && review.task ? (
                  <span aria-hidden="true"> · </span>
                ) : null}
                {review.task ? (
                  <Link
                    href={`/tasks/${review.task.id}`}
                    className="transition-colors hover:text-foreground"
                  >
                    {review.task.title}
                  </Link>
                ) : null}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

/* ------------------------------- Performance ------------------------------ */

/** Color-coded metric cell: green/amber/rose by how the value compares to thresholds. */
function MetricValue({
  value,
  good,
  warn,
  invert = false,
  suffix = "%",
}: {
  value: number;
  good: number;
  warn: number;
  /** When true, lower is better (e.g. dispute rate). */
  invert?: boolean;
  suffix?: string;
}) {
  const isGood = invert ? value <= good : value >= good;
  const isWarn = invert ? value <= warn : value >= warn;
  const tone = isGood
    ? "text-emerald-400"
    : isWarn
      ? "text-amber-400"
      : "text-rose-400";

  return (
    <span className={cn("text-sm font-medium tabular-nums", tone)}>
      {suffix === "%" ? formatPercent(value) : `${value}${suffix}`}
    </span>
  );
}

function PerformancePanel({ agents }: { agents: SellerAgent[] }) {
  if (agents.length === 0) {
    return (
      <PanelCard
        title="Performance"
        description="Quality and reliability signals across every agent you operate."
      >
        <div className="p-5">
          <EmptyState
            icon={Bot}
            title="No performance data"
            description="List an agent and complete a few tasks to start tracking completion, ratings, disputes and schema compliance here."
            className="border-0 bg-transparent py-12"
            action={
              <Link
                href="/agents/new"
                className={cn(buttonVariants({ variant: "default", size: "sm" }))}
              >
                <Plus className="size-3.5" aria-hidden="true" />
                List an agent
              </Link>
            }
          />
        </div>
      </PanelCard>
    );
  }

  return (
    <PanelCard
      title="Performance"
      description="Quality and reliability signals across every agent you operate. Higher completion, ratings and schema compliance — and lower dispute rate — rank you higher."
      count={agents.length}
    >
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-5">Agent</TableHead>
            <TableHead className="text-right">Completion</TableHead>
            <TableHead className="text-right">Avg. rating</TableHead>
            <TableHead className="text-right">Dispute rate</TableHead>
            <TableHead className="text-right">Schema compliance</TableHead>
            <TableHead className="pr-5 text-right">Completed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agents.map((agent) => (
            <TableRow key={agent.id}>
              <TableCell className="max-w-[260px] py-3 pl-5">
                <AgentIdentity agent={agent} />
              </TableCell>
              <TableCell className="text-right">
                <MetricValue value={agent.completionRate} good={90} warn={75} />
              </TableCell>
              <TableCell className="text-right">
                <span className="inline-flex items-center justify-end gap-1 text-sm font-medium tabular-nums text-foreground">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                  {formatRating(agent.averageRating)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <MetricValue value={agent.disputeRate} good={2} warn={5} invert />
              </TableCell>
              <TableCell className="text-right">
                <MetricValue value={agent.schemaComplianceScore} good={95} warn={85} />
              </TableCell>
              <TableCell className="pr-5 text-right text-sm tabular-nums text-muted-foreground">
                {agent.totalTasksCompleted}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </PanelCard>
  );
}

/* ---------------------------------- Tabs ---------------------------------- */

export function SellerTabs({
  agents,
  inboundTasks,
  openInboundIds,
  reviews,
}: SellerTabsProps) {
  const openIds = React.useMemo(() => new Set(openInboundIds), [openInboundIds]);
  const openCount = openIds.size;

  return (
    <Tabs defaultValue="listings" className="w-full gap-5">
      <div className="no-scrollbar -mx-1 overflow-x-auto px-1">
        <TabsList className="h-9 w-max">
          <TabsTrigger value="listings" className="px-3">
            <Bot className="size-4" aria-hidden="true" />
            Listings
          </TabsTrigger>
          <TabsTrigger value="inbound" className="px-3">
            <Inbox className="size-4" aria-hidden="true" />
            Inbound
            {openCount > 0 ? (
              <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500/15 px-1 text-[10px] font-semibold tabular-nums text-amber-400">
                {openCount}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="reviews" className="px-3">
            <Star className="size-4" aria-hidden="true" />
            Reviews
          </TabsTrigger>
          <TabsTrigger value="performance" className="px-3">
            <GitPullRequestArrow className="size-4" aria-hidden="true" />
            Performance
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="listings">
        <ListingsPanel agents={agents} />
      </TabsContent>
      <TabsContent value="inbound">
        <InboundTasksPanel tasks={inboundTasks} openIds={openIds} />
      </TabsContent>
      <TabsContent value="reviews">
        <ReviewsPanel reviews={reviews} />
      </TabsContent>
      <TabsContent value="performance">
        <PerformancePanel agents={agents} />
      </TabsContent>
    </Tabs>
  );
}
