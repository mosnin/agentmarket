import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bot,
  CalendarClock,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  FileOutput,
  FileWarning,
  Gauge,
  ListChecks,
  MessageSquareQuote,
  Package,
  ScrollText,
  ShieldAlert,
  Target,
  User as UserIcon,
  Wallet,
} from "lucide-react";

import { getTask } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import {
  CATEGORY_META,
  DISPUTE_STATUS_META,
  PAYMENT_MODE_META,
  type Category,
  type DisputeStatusValue,
  type PaymentModeValue,
  type ValidationStatusValue,
} from "@/lib/constants";
import {
  cn,
  formatCurrency,
  formatDate,
  formatDateTime,
  initials,
} from "@/lib/utils";
import { isTaskOverdue, isTaskDueSoon } from "@/lib/tasks";

import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { JsonViewer } from "@/components/shared/json-viewer";
import { CategoryIcon } from "@/components/shared/category-icon";
import { ReputationScore } from "@/components/agents/reputation-score";
import { CapabilityBadge } from "@/components/agents/capability-badge";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { PaymentStatusBadge } from "@/components/tasks/payment-status-badge";
import { TaskTimeline } from "@/components/tasks/task-timeline";
import { TaskContractPreview } from "@/components/tasks/task-contract-preview";
import { CopyButton } from "@/components/shared/copy-button";
import { RelativeTime } from "@/components/shared/relative-time";
import { ArtifactCard } from "@/components/tasks/artifact-card";
import { ReviewCard } from "@/components/tasks/review-card";

import { TaskActions } from "./task-actions";

export const dynamic = "force-dynamic";

type Params = { id: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const task = await getTask(id);
  if (!task) {
    return { title: "Task not found — Agent Market" };
  }
  const title = `${task.title} — Agent Market`;
  const description = task.objective.slice(0, 160);
  return {
    title,
    description,
    alternates: { canonical: `/tasks/${task.id}` },
    openGraph: { title, description, type: "article", siteName: "Agent Market" },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** Friendly label for a reputation-event type. */
const REPUTATION_EVENT_LABELS: Record<string, string> = {
  task_completed: "Task completed",
  review_received: "Review received",
  dispute_opened: "Dispute opened",
  dispute_resolved: "Dispute resolved",
  validation_passed: "Validation passed",
  validation_failed: "Validation failed",
  agent_verified: "Agent verified",
  manual_adjustment: "Manual adjustment",
};

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const [task, currentUser] = await Promise.all([getTask(id), getCurrentUser()]);

  if (!task) {
    notFound();
  }

  const categoryMeta = CATEGORY_META[task.category as Category];
  const sellerAgent = task.sellerAgent;
  const payment = task.payment;
  const buyerName = task.buyer.name?.trim() || task.buyer.email || "Unknown buyer";
  const isOwnTask = task.buyerId === currentUser.id;

  const hasReview = task.reviews.length > 0;
  const hasArtifact = task.artifacts.length > 0;
  // Artifacts are ordered newest-first; the head is the most recent submission.
  const latestValidationStatus =
    (task.artifacts[0]?.validationStatus as ValidationStatusValue | undefined) ??
    null;
  const latestValidationScore = task.artifacts[0]?.validationScore ?? null;
  const openDisputes = task.disputes.filter((d) => d.status === "open");

  // Flag a blown deadline so it reads at a glance (shared with the task lists),
  // and a proactive "due soon" the day before.
  const isOverdue = isTaskOverdue(task.deadline, task.status);
  const isDueSoon = !isOverdue && isTaskDueSoon(task.deadline, task.status);

  const paymentMode = (payment?.mode ?? task.contract?.paymentMode) as
    | PaymentModeValue
    | undefined;
  const paymentModeMeta = paymentMode ? PAYMENT_MODE_META[paymentMode] : undefined;

  return (
    <AppShell>
      <div className="space-y-6 lg:space-y-8">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-sm text-muted-foreground"
        >
          <Link
            href="/dashboard"
            className="transition-colors hover:text-foreground"
          >
            Dashboard
          </Link>
          <ChevronRight className="size-3.5 shrink-0 opacity-60" aria-hidden />
          <Link
            href="/dashboard"
            className="transition-colors hover:text-foreground"
          >
            Tasks
          </Link>
          <ChevronRight className="size-3.5 shrink-0 opacity-60" aria-hidden />
          <span
            aria-current="page"
            className="truncate font-medium text-foreground"
          >
            {task.title}
          </span>
          <CopyButton
            value={`https://agentmarket.dev/tasks/${task.id}`}
            label="Copy link"
            className="ml-auto shrink-0"
          />
        </nav>

        {/* Header */}
        <PageHeader
          eyebrow={`${task.category} task`}
          title={
            <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
              {task.title}
              <TaskStatusBadge status={task.status} />
            </span>
          }
          description={
            <span className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
              <span className="inline-flex items-center gap-1.5">
                <UserIcon className="size-3.5 shrink-0" aria-hidden />
                Posted by{" "}
                <span className="font-medium text-foreground">{buyerName}</span>
                {isOwnTask ? (
                  <span className="rounded-full border border-border bg-muted/40 px-1.5 py-px text-[10px] font-medium text-muted-foreground">
                    You
                  </span>
                ) : null}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="size-3.5 shrink-0" aria-hidden />
                Created <RelativeTime date={task.createdAt} />
              </span>
              {task.deadline ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5",
                    isOverdue && "font-medium text-rose-400",
                    isDueSoon && "font-medium text-amber-400",
                  )}
                >
                  <Target className="size-3.5 shrink-0" aria-hidden />
                  {isOverdue ? "Overdue —" : isDueSoon ? "Due soon —" : "Due"}{" "}
                  <RelativeTime date={task.deadline} />
                </span>
              ) : null}
            </span>
          }
          actions={
            sellerAgent ? (
              <Link
                href={`/agents/${sellerAgent.slug}`}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                <Bot className="size-4" />
                View agent
              </Link>
            ) : undefined
          }
        />

        {/* Dispute banner */}
        {openDisputes.length > 0 ? (
          <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
            <ShieldAlert
              className="mt-0.5 size-5 shrink-0 text-rose-400"
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-rose-300">
                {openDisputes.length === 1
                  ? "A dispute is open on this task"
                  : `${openDisputes.length} disputes are open on this task`}
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-rose-300/80">
                {openDisputes[0]?.reason}
              </p>
              <p className="mt-1 text-xs text-rose-300/60">
                Opened <RelativeTime date={openDisputes[0]!.createdAt} /> ·
                Awaiting admin review.
              </p>
            </div>
          </div>
        ) : null}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
          {/* ------------------------------ Main column ------------------------------ */}
          <div className="min-w-0 space-y-6">
            {/* Parties */}
            <SectionCard
              icon={<Activity className="size-4.5" />}
              title="Parties"
              description="The buyer who posted this contract and the agent hired to deliver it."
            >
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
                {/* Buyer */}
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3">
                  <Avatar size="default">
                    <AvatarFallback className="bg-muted text-xs font-medium text-foreground">
                      {initials(buyerName) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Buyer
                    </p>
                    <p className="truncate text-sm font-medium text-foreground">
                      {buyerName}
                    </p>
                  </div>
                </div>

                {/* Connector */}
                <div className="hidden items-center justify-center sm:flex">
                  <span className="flex size-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
                    <ArrowRight className="size-4" aria-hidden />
                  </span>
                </div>

                {/* Seller agent */}
                {sellerAgent ? (
                  <Link
                    href={`/agents/${sellerAgent.slug}`}
                    className="group flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3 transition-colors hover:border-foreground/20 hover:bg-muted/40"
                  >
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-lg",
                        categoryMeta?.iconBg ?? "bg-brand/10",
                        categoryMeta?.iconText ?? "text-brand",
                      )}
                    >
                      <CategoryIcon
                        category={sellerAgent.category}
                        className="size-5"
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Seller agent
                      </p>
                      <p className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
                        <span className="truncate">{sellerAgent.name}</span>
                        {sellerAgent.verified ? (
                          <BadgeCheck
                            className="size-3.5 shrink-0 text-brand"
                            aria-label="Verified"
                          />
                        ) : null}
                      </p>
                    </div>
                    <ArrowUpRight
                      className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                      aria-hidden
                    />
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/10 p-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground">
                      <Bot className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Seller agent
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        Unassigned
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Agent capabilities */}
              {sellerAgent && sellerAgent.capabilities.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {sellerAgent.capabilities.slice(0, 6).map((cap) => (
                    <CapabilityBadge
                      key={cap.id}
                      label={cap.capability.name}
                    />
                  ))}
                </div>
              ) : null}
            </SectionCard>

            {/* Objective */}
            <SectionCard
              icon={<Target className="size-4.5" />}
              title="Objective"
              description="The outcome the agent is contracted to deliver."
            >
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                {task.objective}
              </p>
            </SectionCard>

            {/* Contract */}
            {task.contract ? (
              <div className="space-y-3">
                <SectionHeading
                  icon={<ScrollText className="size-4.5" />}
                  title="The contract"
                  description="The machine-readable agreement signed when this task was posted."
                />
                <TaskContractPreview contract={task.contract} />
              </div>
            ) : null}

            {/* Inputs & outputs */}
            <div className="grid gap-6 lg:grid-cols-2">
              <SectionCard
                icon={<ClipboardList className="size-4.5" />}
                title="Input payload"
                description="Parameters supplied to the agent at hire time."
                compact
              >
                {hasJson(task.contract?.inputPayload) ? (
                  <JsonViewer
                    data={task.contract?.inputPayload}
                    title="input_payload"
                  />
                ) : (
                  <InlineEmpty label="No input payload was attached." />
                )}
              </SectionCard>

              <SectionCard
                icon={<FileOutput className="size-4.5" />}
                title="Output requirements"
                description="The structure the deliverable must conform to."
                compact
              >
                {hasJson(task.contract?.outputSchema) ? (
                  <JsonViewer
                    data={task.contract?.outputSchema}
                    title="output_schema"
                  />
                ) : (
                  <InlineEmpty label="No output schema was defined." />
                )}
              </SectionCard>
            </div>

            {/* Validation rules */}
            <SectionCard
              icon={<ListChecks className="size-4.5" />}
              title="Validation rules"
              description="Automated checks scored against the submitted artifact."
            >
              <ValidationRules rules={task.contract?.validationRules} />
            </SectionCard>

            {/* Artifacts */}
            <div className="space-y-3">
              <SectionHeading
                icon={<Package className="size-4.5" />}
                title="Deliverables"
                description="Artifacts submitted by the agent for this task."
                trailing={
                  hasArtifact ? (
                    <CountPill count={task.artifacts.length} />
                  ) : undefined
                }
              />
              {hasArtifact ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {task.artifacts.map((artifact) => (
                    <ArtifactCard key={artifact.id} artifact={artifact} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Package}
                  title="No deliverables yet"
                  description="Once the agent submits an artifact, it appears here for validation and review."
                />
              )}
            </div>

            {/* Reviews */}
            <div className="space-y-3">
              <SectionHeading
                icon={<MessageSquareQuote className="size-4.5" />}
                title="Reviews"
                description="Buyer feedback that feeds the agent's reputation."
                trailing={
                  hasReview ? (
                    <CountPill count={task.reviews.length} />
                  ) : undefined
                }
              />
              {hasReview ? (
                <div className="space-y-3">
                  {task.reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={MessageSquareQuote}
                  title="No reviews yet"
                  description="A review can be left once the task is completed and payment is released."
                />
              )}
            </div>

            {/* Disputes */}
            {task.disputes.length > 0 ? (
              <div className="space-y-3">
                <SectionHeading
                  icon={<FileWarning className="size-4.5" />}
                  title="Disputes"
                  description="Issues raised against this deliverable."
                  trailing={<CountPill count={task.disputes.length} />}
                />
                <div className="space-y-3">
                  {task.disputes.map((dispute) => (
                    <DisputeRow key={dispute.id} dispute={dispute} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* ------------------------------ Sidebar ------------------------------ */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* State-aware actions */}
            <TaskActions
              task={{
                id: task.id,
                status: task.status,
                hasReview,
                hasArtifact,
                latestValidationStatus,
                latestValidationScore,
              }}
            />

            {/* Payment / budget */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="border-b border-border bg-muted/30 px-5 py-4">
                <div className="flex items-center gap-2">
                  <Wallet className="size-4 text-muted-foreground" aria-hidden />
                  <h2 className="font-heading text-sm font-semibold text-foreground">
                    Payment
                  </h2>
                </div>
              </div>
              <div className="space-y-4 p-5">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Budget
                    </p>
                    <p className="font-heading text-2xl font-semibold tabular-nums text-foreground">
                      {formatCurrency(task.budget, task.currency)}
                    </p>
                  </div>
                  {payment?.status ? (
                    <PaymentStatusBadge status={payment.status} />
                  ) : (
                    <span className="rounded-full border border-border bg-muted/30 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      Not initialized
                    </span>
                  )}
                </div>

                <Separator />

                <dl className="space-y-2.5 text-sm">
                  <MetaRow
                    icon={<CircleDollarSign className="size-3.5" />}
                    label="Mode"
                    value={paymentModeMeta?.label ?? "—"}
                  />
                  {payment ? (
                    <MetaRow
                      icon={<Gauge className="size-3.5" />}
                      label="Provider"
                      value={payment.provider}
                    />
                  ) : null}
                  <MetaRow
                    icon={<CalendarClock className="size-3.5" />}
                    label="Created"
                    value={formatDate(task.createdAt)}
                  />
                </dl>

                {payment?.transactionHash ? (
                  <div>
                    <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Transaction
                    </p>
                    <code className="block w-full overflow-x-auto rounded-lg border border-border bg-background px-2.5 py-1.5 font-mono text-xs text-muted-foreground no-scrollbar">
                      {payment.transactionHash}
                    </code>
                    <div className="mt-1.5 flex justify-end">
                      <CopyButton value={payment.transactionHash} label="Copy hash" />
                    </div>
                  </div>
                ) : null}

                {paymentModeMeta ? (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {paymentModeMeta.description}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Timeline */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="border-b border-border bg-muted/30 px-5 py-4">
                <div className="flex items-center gap-2">
                  <Activity className="size-4 text-muted-foreground" aria-hidden />
                  <h2 className="font-heading text-sm font-semibold text-foreground">
                    Lifecycle
                  </h2>
                </div>
              </div>
              <div className="p-5">
                <TaskTimeline status={task.status} />
              </div>
            </div>

            {/* Seller reputation snapshot */}
            {sellerAgent ? (
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="border-b border-border bg-muted/30 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Bot className="size-4 text-muted-foreground" aria-hidden />
                    <h2 className="font-heading text-sm font-semibold text-foreground">
                      Seller agent
                    </h2>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-5">
                  <ReputationScore score={sellerAgent.reputationScore} size="lg" />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/agents/${sellerAgent.slug}`}
                      className="flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-brand"
                    >
                      <span className="truncate">{sellerAgent.name}</span>
                      {sellerAgent.verified ? (
                        <BadgeCheck className="size-3.5 shrink-0 text-brand" />
                      ) : null}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {sellerAgent.category} ·{" "}
                      {sellerAgent.totalTasksCompleted} completed
                    </p>
                    <Link
                      href={`/agents/${sellerAgent.slug}`}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                    >
                      View profile
                      <ArrowUpRight className="size-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Reputation events from this task */}
            {task.reputationEvents.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="border-b border-border bg-muted/30 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Gauge className="size-4 text-muted-foreground" aria-hidden />
                    <h2 className="font-heading text-sm font-semibold text-foreground">
                      Reputation impact
                    </h2>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Score changes triggered by this task.
                  </p>
                </div>
                <ol className="divide-y divide-border">
                  {task.reputationEvents.map((event) => (
                    <ReputationEventRow key={event.id} event={event} />
                  ))}
                </ol>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

/* ----------------------------- Presentational helpers ----------------------------- */

function SectionHeading({
  icon,
  title,
  description,
  trailing,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="font-heading text-base font-semibold text-foreground">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}

function SectionCard({
  icon,
  title,
  description,
  trailing,
  children,
  compact,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <SectionHeading
        icon={icon}
        title={title}
        description={description}
        trailing={trailing}
      />
      <div className={cn(compact ? "mt-4" : "mt-5")}>{children}</div>
    </section>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
        <span className="text-muted-foreground/70">{icon}</span>
        {label}
      </dt>
      <dd className="truncate text-right font-medium text-foreground" title={value}>
        {value}
      </dd>
    </div>
  );
}

function CountPill({ count }: { count: number }) {
  return (
    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-border bg-muted/40 px-2 text-xs font-medium tabular-nums text-muted-foreground">
      {count}
    </span>
  );
}

function InlineEmpty({ label }: { label: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border bg-muted/10 px-3 py-3 text-xs text-muted-foreground">
      {label}
    </p>
  );
}

/** Renders validation rules as a checklist when shaped as { rules: [...] }, else JSON. */
function ValidationRules({ rules }: { rules: unknown }) {
  const list = extractRulesList(rules);

  if (list && list.length > 0) {
    return (
      <ul className="space-y-2">
        {list.map((rule, i) => (
          <li
            key={i}
            className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-sm text-foreground/90"
          >
            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-brand/40 bg-brand/10 text-[10px] font-semibold tabular-nums text-brand">
              {i + 1}
            </span>
            <span className="leading-relaxed">{rule}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (hasJson(rules)) {
    return <JsonViewer data={rules} title="validation_rules" expandable />;
  }

  return <InlineEmpty label="No validation rules were defined for this task." />;
}

function DisputeRow({
  dispute,
}: {
  dispute: {
    id: string;
    reason: string;
    status: string;
    resolution: string | null;
    createdAt: Date;
    openedBy: { name: string | null; email: string } | null;
  };
}) {
  const meta =
    DISPUTE_STATUS_META[dispute.status as DisputeStatusValue] ??
    DISPUTE_STATUS_META.open;
  const opener =
    dispute.openedBy?.name?.trim() || dispute.openedBy?.email || "A buyer";

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileWarning className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <p className="text-sm font-medium text-foreground">
            Raised by {opener}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
            meta.badge,
          )}
          title={meta.description}
        >
          <span className={cn("size-1.5 rounded-full", meta.dot)} aria-hidden />
          {meta.label}
        </span>
      </div>
      <p className="mt-2.5 text-sm leading-relaxed text-foreground/90">
        {dispute.reason}
      </p>
      {dispute.resolution ? (
        <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-400">
            Resolution
          </p>
          <p className="mt-0.5 text-sm leading-relaxed text-emerald-300/90">
            {dispute.resolution}
          </p>
        </div>
      ) : null}
      <p className="mt-2 text-xs text-muted-foreground">
        {formatDateTime(dispute.createdAt)}
      </p>
    </div>
  );
}

function ReputationEventRow({
  event,
}: {
  event: {
    id: string;
    type: string;
    scoreDelta: number;
    reason: string;
    createdAt: Date;
  };
}) {
  const label = REPUTATION_EVENT_LABELS[event.type] ?? event.type;
  const positive = event.scoreDelta > 0;
  const neutral = event.scoreDelta === 0;

  return (
    <li className="flex items-start gap-3 px-5 py-3">
      <span
        className={cn(
          "mt-0.5 inline-flex h-6 min-w-10 items-center justify-center rounded-md px-1.5 text-xs font-semibold tabular-nums",
          neutral
            ? "bg-muted/50 text-muted-foreground"
            : positive
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-rose-500/10 text-rose-400",
        )}
      >
        {positive ? "+" : ""}
        {event.scoreDelta}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
          {event.reason}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground/70">
          <RelativeTime date={event.createdAt} />
        </p>
      </div>
    </li>
  );
}

/* ----------------------------- Pure helpers ----------------------------- */

function hasJson(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

/** Pull a string[] out of a `{ rules: [...] }` JSON value, when present. */
function extractRulesList(value: unknown): string[] | null {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "rules" in value
  ) {
    const rules = (value as { rules: unknown }).rules;
    if (Array.isArray(rules)) {
      return rules.map((r) => String(r)).filter((r) => r.trim().length > 0);
    }
  }
  if (Array.isArray(value)) {
    return value.map((r) => String(r)).filter((r) => r.trim().length > 0);
  }
  return null;
}
