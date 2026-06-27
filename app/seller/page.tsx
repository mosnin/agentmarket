import type { Metadata } from "next";
import Link from "next/link";
import {
  Banknote,
  Bot,
  CheckCircle2,
  Inbox,
  Plus,
} from "lucide-react";

import { getSellerData } from "@/lib/data";
import { cn, formatCurrency } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { MetricCard } from "@/components/dashboard/metric-card";

import { SellerTabs, type SellerAgent, type SellerReview } from "./seller-tabs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Seller Studio — Agent Market",
  description:
    "Manage your agent listings, inbound work, reviews and earnings in one place.",
  robots: { index: false },
};

type SellerData = Awaited<ReturnType<typeof getSellerData>>;

/** Project the Prisma agent payload down to the lean shape the client tabs need. */
function toSellerAgent(agent: SellerData["agents"][number]): SellerAgent {
  return {
    id: agent.id,
    name: agent.name,
    slug: agent.slug,
    category: agent.category,
    status: agent.status,
    verified: agent.verified,
    pricingModel: agent.pricingModel,
    startingPrice: agent.startingPrice,
    currency: agent.currency,
    reputationScore: agent.reputationScore,
    averageRating: agent.averageRating,
    completionRate: agent.completionRate,
    disputeRate: agent.disputeRate,
    schemaComplianceScore: agent.schemaComplianceScore,
    averageLatencyMinutes: agent.averageLatencyMinutes,
    totalTasksCompleted: agent.totalTasksCompleted,
    capabilities: agent.capabilities.map((c) => ({
      capability: { id: c.capability.id, name: c.capability.name },
    })),
    _count: { tasks: agent._count.tasks, reviews: agent._count.reviews },
  };
}

function toSellerReview(review: SellerData["reviews"][number]): SellerReview {
  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
    user: review.user
      ? { name: review.user.name, email: review.user.email }
      : null,
    agent: review.agent ? { name: review.agent.name } : null,
    task: review.task ? { id: review.task.id, title: review.task.title } : null,
  };
}

export default async function SellerPage() {
  const data = await getSellerData();
  const { agents, inboundTasks, openInbound, reviews, totalEarnings, completedCount } =
    data;

  const sellerAgents = agents.map(toSellerAgent);
  const sellerReviews = reviews.map(toSellerReview);
  const openInboundIds = openInbound.map((t) => t.id);

  return (
    <AppShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Seller Studio"
          title="Seller Studio"
          description="Manage your listings, inbound work, and earnings — everything your agents need to win and deliver tasks on Agent Market."
          actions={
            <Link
              href="/agents/new"
              className={cn(buttonVariants({ variant: "default", size: "lg" }))}
            >
              <Plus className="size-4" aria-hidden="true" />
              New agent
            </Link>
          }
        />

        {/* KPI row */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <MetricCard
            label="Total earnings"
            value={formatCurrency(totalEarnings)}
            icon={Banknote}
            accent="text-emerald-400"
            hint="Released to your agents"
          />
          <MetricCard
            label="Agents listed"
            value={agents.length}
            icon={Bot}
            accent="text-violet-400"
            hint="Active across your fleet"
          />
          <MetricCard
            label="Open inbound"
            value={openInbound.length}
            icon={Inbox}
            accent="text-amber-400"
            hint="Tasks awaiting delivery"
          />
          <MetricCard
            label="Completed tasks"
            value={completedCount}
            icon={CheckCircle2}
            accent="text-brand"
            hint="Settled successfully"
          />
        </div>

        {/* Tabs */}
        <SellerTabs
          agents={sellerAgents}
          inboundTasks={inboundTasks}
          openInboundIds={openInboundIds}
          reviews={sellerReviews}
        />
      </div>
    </AppShell>
  );
}
