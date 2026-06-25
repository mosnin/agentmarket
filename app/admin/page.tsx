import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  Bot,
  CheckCircle2,
  CircleDollarSign,
  Coins,
  Gavel,
  Hash,
  History,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Users,
} from "lucide-react";

import { getAdminData } from "@/lib/data";
import {
  DISPUTE_STATUS_META,
  type DisputeStatusValue,
  PAYMENT_MODE_META,
  type PaymentModeValue,
} from "@/lib/constants";
import { cn, formatCurrency, formatDateTime, formatRelativeTime } from "@/lib/utils";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/dashboard/metric-card";
import { CategoryIcon } from "@/components/shared/category-icon";
import { ReputationScore } from "@/components/agents/reputation-score";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { PaymentStatusBadge } from "@/components/tasks/payment-status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { AdminTabs, type AdminTab } from "./admin-tabs";
import {
  AgentStatusToggle,
  ResolveDisputeButton,
  VerifiedIndicator,
  VerifyAgentButton,
} from "./admin-actions";

export const dynamic = "force-dynamic";

type AdminData = Awaited<ReturnType<typeof getAdminData>>;
type AdminAgent = AdminData["agents"][number];
type AdminDispute = AdminData["disputes"][number];
type AdminPayment = AdminData["payments"][number];
type AdminReputationEvent = AdminData["reputationEvents"][number];
type AdminSuspiciousTask = AdminData["suspiciousTasks"][number];

/* --------------------------------- Helpers --------------------------------- */

/** Reputation-event types (mirror the Prisma `ReputationEventType` enum). */
type ReputationEventTypeValue =
  | "task_completed"
  | "review_received"
  | "dispute_opened"
  | "dispute_resolved"
  | "validation_passed"
  | "validation_failed"
  | "agent_verified"
  | "manual_adjustment";

/** Humanize a snake_cased reputation-event type, e.g. "validation_passed". */
function humanizeEventType(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Icon-tile color treatment per reputation-event type. */
const REPUTATION_EVENT_TILE: Record<ReputationEventTypeValue, string> = {
  task_completed: "bg-emerald-500/10 text-emerald-400",
  review_received: "bg-amber-500/10 text-amber-400",
  dispute_opened: "bg-rose-500/10 text-rose-400",
  dispute_resolved: "bg-sky-500/10 text-sky-400",
  validation_passed: "bg-lime-500/10 text-lime-400",
  validation_failed: "bg-rose-500/10 text-rose-400",
  agent_verified: "bg-brand/10 text-brand",
  manual_adjustment: "bg-muted text-muted-foreground",
};

/** Glyph per reputation-event type. */
const REPUTATION_EVENT_ICON: Record<
  ReputationEventTypeValue,
  React.ComponentType<{ className?: string }>
> = {
  task_completed: CheckCircle2,
  review_received: Star,
  dispute_opened: ShieldAlert,
  dispute_resolved: Gavel,
  validation_passed: BadgeCheck,
  validation_failed: AlertTriangle,
  agent_verified: ShieldCheck,
  manual_adjustment: SlidersHorizontal,
};

/** Truncate a long mock transaction hash to a head…tail mono string. */
function shortHash(hash: string | null): string | null {
  if (!hash) return null;
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
}

/* --------------------------------- Page --------------------------------- */

export default async function AdminPage() {
  const data = await getAdminData();
  const { agents, disputes, payments, reputationEvents, suspiciousTasks, stats } =
    data;

  const openDisputes = disputes.filter((d) => d.status === "open").length;
  const escrowedTotal = payments
    .filter((p) => p.status === "escrowed")
    .reduce((sum, p) => sum + p.amount, 0);
  const verifiedShare =
    stats.totalAgents > 0
      ? Math.round((stats.verifiedAgents / stats.totalAgents) * 100)
      : 0;

  const tabs: AdminTab[] = [
    {
      value: "agents",
      label: "Agents",
      icon: <Bot className="size-4" />,
      count: agents.length,
      content: <AgentsTable agents={agents} />,
    },
    {
      value: "disputes",
      label: "Disputes",
      icon: <Gavel className="size-4" />,
      count: openDisputes || undefined,
      content: <DisputesPanel disputes={disputes} />,
    },
    {
      value: "suspicious",
      label: "Suspicious tasks",
      icon: <ShieldAlert className="size-4" />,
      count: suspiciousTasks.length || undefined,
      content: <SuspiciousTasksPanel tasks={suspiciousTasks} />,
    },
    {
      value: "payments",
      label: "Payments",
      icon: <CircleDollarSign className="size-4" />,
      count: payments.length,
      content: <PaymentsTable payments={payments} />,
    },
    {
      value: "reputation",
      label: "Reputation events",
      icon: <History className="size-4" />,
      count: reputationEvents.length,
      content: <ReputationFeed events={reputationEvents} />,
    },
  ];

  return (
    <AppShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Operations"
          title="Admin"
          description="Moderate the marketplace — verify agents, settle disputes, and keep an eye on payments and reputation across the network."
          actions={
            <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="size-4 text-brand" aria-hidden />
              Trust &amp; safety console
            </span>
          }
        />

        {/* Stat row */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <MetricCard
            label="Total agents"
            value={stats.totalAgents}
            icon={Users}
            hint={`${agents.filter((a) => a.status === "active").length} active in the marketplace`}
          />
          <MetricCard
            label="Verified"
            value={stats.verifiedAgents}
            icon={ShieldCheck}
            accent="text-brand"
            hint={`${verifiedShare}% of the catalog is verified`}
          />
          <MetricCard
            label="Open disputes"
            value={stats.openDisputes}
            icon={Gavel}
            accent={stats.openDisputes > 0 ? "text-amber-400" : undefined}
            hint={
              stats.openDisputes > 0
                ? "Awaiting an admin decision"
                : "No disputes need attention"
            }
          />
          <MetricCard
            label="Escrow held"
            value={formatCurrency(escrowedTotal)}
            icon={Coins}
            hint={`${stats.totalPayments} payments in the ledger`}
          />
        </div>

        {/* Tabs */}
        <AdminTabs tabs={tabs} defaultValue="agents" />
      </div>
    </AppShell>
  );
}

/* --------------------------------- Section shell --------------------------------- */

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <header className="flex flex-col gap-1 border-b border-border bg-muted/20 px-5 py-4">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-brand" aria-hidden />
          <h2 className="font-heading text-sm font-semibold text-foreground">
            {title}
          </h2>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </header>
      {children}
    </section>
  );
}

/* --------------------------------- Agents --------------------------------- */

function AgentsTable({ agents }: { agents: AdminAgent[] }) {
  if (agents.length === 0) {
    return (
      <EmptyState
        icon={Bot}
        title="No agents yet"
        description="When operators list agents on the marketplace, they show up here for moderation and verification."
      />
    );
  }

  return (
    <SectionCard
      title="Agent roster"
      description="Every listed agent, newest first. Verify trustworthy agents and suspend any that breach the marketplace policy."
      icon={Bot}
    >
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-5">Agent</TableHead>
            <TableHead className="hidden md:table-cell">Owner</TableHead>
            <TableHead className="hidden lg:table-cell">Organization</TableHead>
            <TableHead className="hidden sm:table-cell">Category</TableHead>
            <TableHead>Verified</TableHead>
            <TableHead className="hidden xl:table-cell">Reputation</TableHead>
            <TableHead className="pr-5 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agents.map((agent) => (
            <TableRow key={agent.id} className="align-middle">
              <TableCell className="max-w-[16rem] pl-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 ring-1 ring-border">
                    <CategoryIcon
                      category={agent.category}
                      className="size-4 text-muted-foreground"
                    />
                  </span>
                  <div className="min-w-0">
                    <Link
                      href={`/agents/${agent.slug}`}
                      className="block truncate text-sm font-medium text-foreground transition-colors hover:text-brand"
                    >
                      {agent.name}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {agent._count.tasks} tasks · {agent._count.reviews} reviews
                    </p>
                  </div>
                </div>
              </TableCell>

              <TableCell className="hidden max-w-[12rem] md:table-cell">
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">
                    {agent.owner.name ?? "Unnamed operator"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {agent.owner.email}
                  </p>
                </div>
              </TableCell>

              <TableCell className="hidden lg:table-cell">
                <span className="text-sm text-muted-foreground">
                  {agent.organization?.name ?? "—"}
                </span>
              </TableCell>

              <TableCell className="hidden sm:table-cell">
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CategoryIcon
                    category={agent.category}
                    className="size-3.5 text-muted-foreground/80"
                  />
                  {agent.category}
                </span>
              </TableCell>

              <TableCell>
                <VerifiedIndicator verified={agent.verified} />
              </TableCell>

              <TableCell className="hidden xl:table-cell">
                <ReputationScore score={agent.reputationScore} size="sm" />
              </TableCell>

              <TableCell className="pr-5">
                <div className="flex items-center justify-end gap-2">
                  {!agent.verified ? (
                    <VerifyAgentButton agentId={agent.id} agentName={agent.name} />
                  ) : null}
                  <AgentStatusToggle
                    agentId={agent.id}
                    agentName={agent.name}
                    status={agent.status}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}

/* --------------------------------- Disputes --------------------------------- */

function DisputesPanel({ disputes }: { disputes: AdminDispute[] }) {
  if (disputes.length === 0) {
    return (
      <EmptyState
        icon={Gavel}
        title="No disputes filed"
        description="A clean record. When a buyer flags a deliverable, the case lands here for review and resolution."
      />
    );
  }

  return (
    <SectionCard
      title="Dispute queue"
      description="Buyer-raised complaints on deliverables. Review the context, then record a resolution to settle the case."
      icon={Gavel}
    >
      <ul className="divide-y divide-border">
        {disputes.map((dispute) => {
          const meta =
            DISPUTE_STATUS_META[dispute.status as DisputeStatusValue] ??
            DISPUTE_STATUS_META.open;
          const isOpen = dispute.status === "open";
          return (
            <li key={dispute.id} className="px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/tasks/${dispute.taskId}`}
                      className="truncate text-sm font-medium text-foreground transition-colors hover:text-brand"
                    >
                      {dispute.task.title}
                    </Link>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
                        meta.badge,
                      )}
                      title={meta.description}
                    >
                      <span
                        className={cn("size-1.5 rounded-full", meta.dot)}
                        aria-hidden
                      />
                      {meta.label}
                    </span>
                  </div>
                  <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">
                    {dispute.reason}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-3.5" aria-hidden />
                      Opened by {dispute.openedBy.name ?? dispute.openedBy.email}
                    </span>
                    {dispute.task.sellerAgent ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Bot className="size-3.5" aria-hidden />
                        {dispute.task.sellerAgent.name}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1.5">
                      <History className="size-3.5" aria-hidden />
                      {formatRelativeTime(dispute.createdAt)}
                    </span>
                  </div>
                  {dispute.resolution ? (
                    <div className="mt-1 flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-300">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                      <span className="leading-relaxed">{dispute.resolution}</span>
                    </div>
                  ) : null}
                </div>

                <div className="shrink-0">
                  {isOpen ? (
                    <ResolveDisputeButton
                      disputeId={dispute.id}
                      taskTitle={dispute.task.title}
                    />
                  ) : (
                    <Link
                      href={`/tasks/${dispute.taskId}`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      View task
                      <ArrowUpRight className="size-3.5" aria-hidden />
                    </Link>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}

/* --------------------------------- Suspicious tasks --------------------------------- */

function SuspiciousTasksPanel({ tasks }: { tasks: AdminSuspiciousTask[] }) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Nothing flagged"
        description="No disputed tasks and no failed validations. The marketplace is running clean right now."
      />
    );
  }

  return (
    <SectionCard
      title="Flagged for review"
      description="Tasks that are disputed or have an artifact that failed validation. Open each one to investigate the deliverable."
      icon={ShieldAlert}
    >
      <ul className="divide-y divide-border">
        {tasks.map((task) => {
          const reason =
            task.status === "disputed"
              ? "An open dispute is attached to this task."
              : "An artifact failed automated validation.";
          return (
            <li
              key={task.id}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/30"
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg ring-1",
                  task.status === "disputed"
                    ? "bg-rose-500/10 text-rose-400 ring-rose-500/20"
                    : "bg-amber-500/10 text-amber-400 ring-amber-500/20",
                )}
              >
                <AlertTriangle className="size-4" aria-hidden />
              </span>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/tasks/${task.id}`}
                  className="block truncate text-sm font-medium text-foreground transition-colors hover:text-brand"
                >
                  {task.title}
                </Link>
                <p className="truncate text-xs text-muted-foreground">{reason}</p>
              </div>

              <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                <CategoryIcon
                  category={task.category}
                  className="size-3.5 text-muted-foreground/80"
                />
                {task.category}
              </div>

              <TaskStatusBadge status={task.status} />

              <Link
                href={`/tasks/${task.id}`}
                className="hidden items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
              >
                Investigate
                <ArrowUpRight className="size-3.5" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}

/* --------------------------------- Payments --------------------------------- */

function PaymentsTable({ payments }: { payments: AdminPayment[] }) {
  if (payments.length === 0) {
    return (
      <EmptyState
        icon={CircleDollarSign}
        title="No payments recorded"
        description="The settlement ledger is empty. Escrow, releases, and refunds will appear here as tasks move through their lifecycle."
      />
    );
  }

  return (
    <SectionCard
      title="Settlement ledger"
      description="The 30 most recent payments across the marketplace — escrow holds, releases, and refunds with their mock transaction hashes."
      icon={CircleDollarSign}
    >
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-5">Task</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden sm:table-cell">Mode</TableHead>
            <TableHead className="hidden lg:table-cell">Provider</TableHead>
            <TableHead className="hidden md:table-cell">Transaction</TableHead>
            <TableHead className="hidden pr-5 text-right xl:table-cell">
              Created
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => {
            const modeMeta =
              PAYMENT_MODE_META[payment.mode as PaymentModeValue];
            const hash = shortHash(payment.transactionHash);
            return (
              <TableRow key={payment.id}>
                <TableCell className="max-w-[16rem] pl-5">
                  <Link
                    href={`/tasks/${payment.task.id}`}
                    className="block truncate text-sm font-medium text-foreground transition-colors hover:text-brand"
                  >
                    {payment.task.title}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">
                    {payment.task.category}
                  </p>
                </TableCell>

                <TableCell className="text-right text-sm font-semibold tabular-nums text-foreground">
                  {formatCurrency(payment.amount, payment.currency)}
                </TableCell>

                <TableCell>
                  <PaymentStatusBadge status={payment.status} />
                </TableCell>

                <TableCell className="hidden sm:table-cell">
                  <span className="text-sm text-muted-foreground">
                    {modeMeta?.label ?? payment.mode}
                  </span>
                </TableCell>

                <TableCell className="hidden lg:table-cell">
                  <span className="font-mono text-xs text-muted-foreground">
                    {payment.provider}
                  </span>
                </TableCell>

                <TableCell className="hidden md:table-cell">
                  {hash ? (
                    <span
                      className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground"
                      title={payment.transactionHash ?? undefined}
                    >
                      <Hash className="size-3 shrink-0 text-muted-foreground/70" aria-hidden />
                      {hash}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground/60">—</span>
                  )}
                </TableCell>

                <TableCell className="hidden pr-5 text-right text-xs whitespace-nowrap text-muted-foreground xl:table-cell">
                  {formatDateTime(payment.createdAt)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </SectionCard>
  );
}

/* --------------------------------- Reputation feed --------------------------------- */

function ReputationFeed({ events }: { events: AdminReputationEvent[] }) {
  if (events.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No reputation activity"
        description="Completed tasks, reviews, disputes, and verifications all adjust agent reputation. Those events will stream in here."
      />
    );
  }

  return (
    <SectionCard
      title="Reputation activity"
      description="A live audit trail of every reputation change across the network — what happened, to whom, and by how much."
      icon={ScrollText}
    >
      <ul className="divide-y divide-border">
        {events.map((event) => {
          const key =
            (event.type as ReputationEventTypeValue) in REPUTATION_EVENT_TILE
              ? (event.type as ReputationEventTypeValue)
              : "manual_adjustment";
          const tile = REPUTATION_EVENT_TILE[key];
          const EventIcon = REPUTATION_EVENT_ICON[key];
          const positive = event.scoreDelta >= 0;
          const deltaLabel = `${positive ? "+" : ""}${event.scoreDelta}`;
          return (
            <li
              key={event.id}
              className="flex items-start gap-3.5 px-5 py-4 transition-colors hover:bg-muted/30"
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
                  tile,
                )}
              >
                <EventIcon className="size-4" aria-hidden />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <p className="text-sm font-medium text-foreground">
                    {event.agent.name}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {humanizeEventType(event.type)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground text-pretty">
                  {event.reason}
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1">
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums",
                    positive
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-rose-500/10 text-rose-400",
                  )}
                >
                  {positive ? (
                    <ArrowUpRight className="size-3" aria-hidden />
                  ) : (
                    <ArrowDownRight className="size-3" aria-hidden />
                  )}
                  {deltaLabel}
                </span>
                <span className="text-[11px] whitespace-nowrap text-muted-foreground">
                  {formatRelativeTime(event.createdAt)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
