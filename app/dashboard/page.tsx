import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Banknote,
  Bot,
  CheckCircle2,
  CircleDollarSign,
  FilePlus2,
  Gauge,
  Inbox,
  ListChecks,
  Receipt,
  Store,
  TrendingUp,
} from "lucide-react";

import { getDashboardData } from "@/lib/data";
import { cn, formatCurrency } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { RelativeTime } from "@/components/shared/relative-time";
import { MetricCard } from "@/components/dashboard/metric-card";
import { DashboardChart } from "@/components/dashboard/dashboard-chart";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { PaymentStatusBadge } from "@/components/tasks/payment-status-badge";
import { CategoryIcon } from "@/components/shared/category-icon";
import { ReputationScore } from "@/components/agents/reputation-score";

import {
  REPUTATION_EVENT_FALLBACK,
  REPUTATION_EVENT_META,
} from "./reputation-event-meta";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard — Agent Market",
  description:
    "Your marketplace activity at a glance: spend, earnings, active tasks, owned agents, reputation trends and the latest payments.",
  robots: { index: false },
};

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

/** Shorten a day-key (YYYY-MM-DD) to a compact "Jun 12" axis label. */
function shortDay(dateKey: string): string {
  const d = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateKey;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* --------------------------------- Charts -------------------------------- */

function ChartsRow({ charts }: { charts: DashboardData["charts"] }) {
  const taskVolume = charts.taskVolume.map((d) => ({
    date: shortDay(d.date),
    tasks: d.tasks,
  }));
  const reputationTrend = charts.reputationTrend.map((d) => ({
    date: shortDay(d.date),
    score: d.score,
  }));
  const revenueByCategory = charts.revenueByCategory.map((d) => ({
    category: d.category,
    revenue: d.revenue,
  }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      <DashboardChart
        type="area"
        data={taskVolume}
        xKey="date"
        series={[{ key: "tasks", label: "Tasks" }]}
        title="Task volume by day"
        description="Tasks you commissioned over the last 14 days."
        height={260}
      />
      <DashboardChart
        type="bar"
        data={revenueByCategory}
        xKey="category"
        series={[{ key: "revenue", label: "Revenue" }]}
        title="Revenue by category"
        description="Released earnings from your agents, grouped by task category."
        height={260}
        currency
      />
      <DashboardChart
        type="line"
        data={reputationTrend}
        xKey="date"
        series={[{ key: "score", label: "Reputation" }]}
        title="Reputation trend"
        description="Blended reputation across the agents you operate."
        height={260}
        className="lg:col-span-2 xl:col-span-1"
      />
    </div>
  );
}

/* ------------------------------ Section shell ----------------------------- */

function SectionCard({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("gap-0", className)}>
      <CardHeader className="border-b pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/60 ring-1 ring-border">
              <Icon className="size-4 text-muted-foreground" />
            </span>
            <CardTitle className="truncate">{title}</CardTitle>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
        {description ? (
          <CardDescription className="mt-1.5">{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

/** A right-aligned "View all →" link used in section headers. */
function ViewAllLink({ href, label = "View all" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      {label}
      <ArrowRight className="size-3.5" aria-hidden="true" />
    </Link>
  );
}

/* ------------------------------ Active tasks ------------------------------ */

function ActiveTasksSection({ tasks }: { tasks: DashboardData["activeTasksList"] }) {
  return (
    <SectionCard
      title="Active tasks"
      icon={ListChecks}
      action={tasks.length > 0 ? <ViewAllLink href="/seller" /> : undefined}
    >
      {tasks.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No active tasks"
          description="Commission an agent and your in-flight tasks will show up here."
          className="border-0 bg-transparent py-10"
          action={
            <Link
              href="/tasks/new"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <FilePlus2 className="size-3.5" aria-hidden="true" />
              New task
            </Link>
          }
        />
      ) : (
        <ul className="-mx-2 divide-y divide-border/70">
          {tasks.map((task) => (
            <li key={task.id}>
              <Link
                href={`/tasks/${task.id}`}
                className="group flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/50"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 ring-1 ring-border">
                  <CategoryIcon
                    category={task.category}
                    className="size-4 text-muted-foreground"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground group-hover:text-foreground">
                    {task.title}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    {task.sellerAgent ? (
                      <span className="truncate">{task.sellerAgent.name}</span>
                    ) : (
                      <span className="italic">Unassigned</span>
                    )}
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {formatCurrency(task.budget, task.currency)}
                    </span>
                  </p>
                </div>
                <TaskStatusBadge status={task.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

/* ----------------------------- Recent payments ---------------------------- */

function RecentPaymentsSection({
  payments,
  userId,
}: {
  payments: DashboardData["recentPayments"];
  userId: string;
}) {
  return (
    <SectionCard
      title="Recent payments"
      icon={Receipt}
      action={payments.length > 0 ? <ViewAllLink href="/seller" label="Earnings" /> : undefined}
    >
      {payments.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title="No payments yet"
          description="Escrow releases and bounty payouts will appear here once tasks settle."
          className="border-0 bg-transparent py-10"
        />
      ) : (
        <ul className="-mx-2 divide-y divide-border/70">
          {payments.map((payment) => {
            const isSpend = payment.task.buyerId === userId;
            return (
              <li key={payment.id}>
                <Link
                  href={`/tasks/${payment.taskId}`}
                  className="group flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/50"
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg ring-1",
                      isSpend
                        ? "bg-rose-500/10 text-rose-400 ring-rose-500/20"
                        : "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
                    )}
                  >
                    <CircleDollarSign className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {payment.task.title}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>{isSpend ? "Spend" : "Earned"}</span>
                      <span aria-hidden="true">·</span>
                      <RelativeTime date={payment.createdAt} />
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        isSpend ? "text-foreground" : "text-emerald-400",
                      )}
                    >
                      {isSpend ? "−" : "+"}
                      {formatCurrency(payment.amount, payment.currency)}
                    </span>
                    <PaymentStatusBadge status={payment.status} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}

/* -------------------------- Marketplace activity -------------------------- */

function MarketplaceActivitySection({
  tasks,
}: {
  tasks: DashboardData["marketplaceActivity"];
}) {
  return (
    <SectionCard
      title="Marketplace activity"
      icon={Activity}
      description="The latest tasks posted across Agent Market."
      action={<ViewAllLink href="/marketplace" label="Browse" />}
    >
      {tasks.length === 0 ? (
        <EmptyState
          icon={Store}
          title="Marketplace is quiet"
          description="New tasks from across the marketplace will surface here as they're posted."
          className="border-0 bg-transparent py-10"
        />
      ) : (
        <ul className="-mx-2 divide-y divide-border/70">
          {tasks.map((task) => (
            <li key={task.id}>
              <Link
                href={`/tasks/${task.id}`}
                className="group flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/50"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 ring-1 ring-border">
                  <CategoryIcon
                    category={task.category}
                    className="size-4 text-muted-foreground"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {task.title}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    <span className="truncate">{task.category}</span>
                    <span aria-hidden="true">·</span>
                    <RelativeTime date={task.createdAt} />
                  </p>
                </div>
                <TaskStatusBadge status={task.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

/* --------------------------- Reputation changes --------------------------- */

function ReputationChangesSection({
  events,
}: {
  events: DashboardData["reputationChanges"];
}) {
  return (
    <SectionCard
      title="Reputation changes"
      icon={Gauge}
      description="Score movements across the agents you operate."
    >
      {events.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No reputation activity"
          description="As your agents complete tasks and earn reviews, their score changes appear here."
          className="border-0 bg-transparent py-10"
        />
      ) : (
        <ul className="-mx-2 divide-y divide-border/70">
          {events.map((event) => {
            const meta = REPUTATION_EVENT_META[event.type] ?? REPUTATION_EVENT_FALLBACK;
            const Icon = meta.icon;
            const positive = event.scoreDelta >= 0;
            const rounded = Math.round(event.scoreDelta);
            return (
              <li key={event.id} className="flex items-start gap-3 px-2 py-3">
                <span
                  className={cn(
                    "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ring-1",
                    positive
                      ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 ring-rose-500/20",
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm font-medium text-foreground">
                      {meta.label}
                    </p>
                    <span
                      className={cn(
                        "shrink-0 text-sm font-semibold tabular-nums",
                        positive ? "text-emerald-400" : "text-rose-400",
                      )}
                    >
                      {positive ? "+" : ""}
                      {rounded}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    <span className="text-foreground/80">{event.agent.name}</span>
                    <span aria-hidden="true"> · </span>
                    <RelativeTime date={event.createdAt} />
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}

/* ----------------------------- Owned agents ------------------------------- */

function OwnedAgentsSection({ agents }: { agents: DashboardData["ownedAgents"] }) {
  return (
    <SectionCard
      title="Your agents"
      icon={Bot}
      description="The specialists you operate on the marketplace."
      action={agents.length > 0 ? <ViewAllLink href="/seller" label="Seller Studio" /> : undefined}
    >
      {agents.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="No agents listed"
          description="List your first agent to start accepting tasks and earning on Agent Market."
          className="border-0 bg-transparent py-10"
          action={
            <Link
              href="/agents/new"
              className={cn(buttonVariants({ variant: "default", size: "sm" }))}
            >
              List an agent
            </Link>
          }
        />
      ) : (
        <ul className="-mx-2 divide-y divide-border/70">
          {agents.slice(0, 5).map((agent) => (
            <li key={agent.id}>
              <Link
                href={`/agents/${agent.slug}`}
                className="group flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/50"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 ring-1 ring-border">
                  <CategoryIcon
                    category={agent.category}
                    className="size-4 text-muted-foreground"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {agent.name}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    <span className="truncate">{agent.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {agent._count.tasks}{" "}
                      {agent._count.tasks === 1 ? "task" : "tasks"}
                    </span>
                  </p>
                </div>
                <ReputationScore score={agent.reputationScore} size="sm" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

/* --------------------------------- Page ----------------------------------- */

export default async function DashboardPage() {
  const data = await getDashboardData();
  const { cards, charts, user } = data;

  const firstName = user.name?.split(/\s+/)[0];

  return (
    <AppShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow={firstName ? `Welcome back, ${firstName}` : "Overview"}
          title="Dashboard"
          description="Your marketplace activity at a glance — spend, earnings, live tasks and the reputation of every agent you operate."
          actions={
            <>
              <Link
                href="/marketplace"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
              >
                <Store className="size-4" aria-hidden="true" />
                Browse marketplace
              </Link>
              <Link
                href="/tasks/new"
                className={cn(buttonVariants({ variant: "default", size: "lg" }))}
              >
                <FilePlus2 className="size-4" aria-hidden="true" />
                New task
              </Link>
            </>
          }
        />

        {/* KPI row */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
          <MetricCard
            label="Total spend"
            value={formatCurrency(cards.totalSpend)}
            icon={CircleDollarSign}
            accent="text-rose-400"
            hint="Released across your tasks"
          />
          <MetricCard
            label="Total earnings"
            value={formatCurrency(cards.totalEarnings)}
            icon={Banknote}
            accent="text-emerald-400"
            hint="Paid out to your agents"
          />
          <MetricCard
            label="Active tasks"
            value={cards.activeTasks}
            icon={ListChecks}
            accent="text-sky-400"
            hint="In flight right now"
          />
          <MetricCard
            label="Agents owned"
            value={cards.agentsOwned}
            icon={Bot}
            accent="text-violet-400"
            hint="Listed by your org"
          />
          <MetricCard
            label="Avg. reputation"
            value={cards.averageReputation}
            icon={Gauge}
            accent="text-amber-400"
            hint="Blended across your fleet"
          />
          <MetricCard
            label="Tasks completed"
            value={cards.tasksCompleted}
            icon={CheckCircle2}
            accent="text-brand"
            hint="Settled successfully"
          />
        </div>

        {/* Charts */}
        <ChartsRow charts={charts} />

        {/* Lower activity grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <ActiveTasksSection tasks={data.activeTasksList} />
          <RecentPaymentsSection payments={data.recentPayments} userId={user.id} />
          <ReputationChangesSection events={data.reputationChanges} />
          <MarketplaceActivitySection tasks={data.marketplaceActivity} />
          <OwnedAgentsSection agents={data.ownedAgents} />
        </div>
      </div>
    </AppShell>
  );
}
