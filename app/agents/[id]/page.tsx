import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Boxes,
  Clock,
  Code2,
  FileCode2,
  FileJson2,
  Gauge,
  Globe,
  Layers,
  MessageSquareQuote,
  Network,
  Package,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
} from "lucide-react";

import { getAgent } from "@/lib/data";
import {
  CATEGORY_META,
  PAYMENT_MODE_META,
  PRICING_MODEL_META,
  type Category,
  type PaymentModeValue,
  type PricingModelValue,
} from "@/lib/constants";
import { getAgentCard } from "@/lib/interop/a2aAdapter";
import { listToolsForAgent, validateMcpServer } from "@/lib/interop/mcpAdapter";
import {
  cn,
  formatCurrency,
  formatLatency,
  formatNumber,
  formatPercent,
  formatRating,
} from "@/lib/utils";
import { RelativeTime } from "@/components/shared/relative-time";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { LandingNav } from "@/components/layout/landing-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { EmptyState } from "@/components/shared/empty-state";
import { JsonViewer } from "@/components/shared/json-viewer";
import { AgentProfileHeader } from "@/components/agents/agent-profile-header";
import { CapabilityBadge } from "@/components/agents/capability-badge";
import { ReputationScore } from "@/components/agents/reputation-score";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { ReviewCard } from "@/components/tasks/review-card";
import { ArtifactCard } from "@/components/tasks/artifact-card";

import { ProfileTabs, type ProfileTab } from "./profile-tabs";

export const dynamic = "force-dynamic";

type Params = { id: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const agent = await getAgent(id);
  if (!agent) {
    return { title: "Agent not found — Agent Market" };
  }
  return {
    title: `${agent.name} — Agent Market`,
    description: agent.shortDescription,
  };
}

// ----------------------------- Small presentational helpers -----------------------------

function SectionCard({
  title,
  description,
  icon,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card p-5 sm:p-6",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {icon ? (
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
              {icon}
            </span>
          ) : null}
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
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function KeyValueRow({
  label,
  children,
  mono,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <dt className="shrink-0 text-sm font-medium text-muted-foreground sm:w-44">
        {label}
      </dt>
      <dd
        className={cn(
          "min-w-0 text-sm break-words text-foreground sm:text-right",
          mono && "font-mono text-[13px]",
        )}
      >
        {children}
      </dd>
    </div>
  );
}

function MetricTile({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ReactNode;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  const toneText =
    tone === "good"
      ? "text-emerald-400"
      : tone === "warn"
        ? "text-amber-400"
        : tone === "bad"
          ? "text-rose-400"
          : "text-foreground";

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-muted-foreground/70">{icon}</span>
      </div>
      <div className={cn("text-2xl font-semibold tabular-nums", toneText)}>
        {value}
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function TrustRow({
  icon,
  label,
  value,
  tone = "muted",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "good" | "muted";
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <span className="flex items-center gap-2.5 text-sm text-muted-foreground">
        <span
          className={cn(
            tone === "good" ? "text-emerald-400" : "text-muted-foreground",
          )}
        >
          {icon}
        </span>
        {label}
      </span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </li>
  );
}

// ----------------------------- Page -----------------------------

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const agent = await getAgent(id);

  if (!agent) {
    notFound();
  }

  const categoryMeta = CATEGORY_META[agent.category as Category];
  const pricingMeta = PRICING_MODEL_META[agent.pricingModel as PricingModelValue];
  const capabilityNames = agent.capabilities.map((c) => c.capability.name);

  const priceLabel =
    agent.pricingModel === "free"
      ? "Free"
      : formatCurrency(agent.startingPrice, agent.currency);
  const priceSuffix = agent.pricingModel === "free" ? "" : (pricingMeta?.suffix ?? "");

  // Interop payloads (mock adapters).
  const mcpTools = listToolsForAgent({
    capabilities: capabilityNames,
    category: agent.category,
  });
  const mcpValidation = validateMcpServer(agent.mcpServerUrl);
  const agentCard = getAgentCard({
    id: agent.id,
    slug: agent.slug,
    name: agent.name,
    shortDescription: agent.shortDescription,
    category: agent.category,
    capabilities: capabilityNames,
    pricingModel: agent.pricingModel,
    startingPrice: agent.startingPrice,
    currency: agent.currency,
    endpointUrl: agent.endpointUrl,
    mcpServerUrl: agent.mcpServerUrl,
    verified: agent.verified,
    reputationScore: agent.reputationScore,
    inputSchema: agent.inputSchema as Record<string, unknown> | null,
    outputSchema: agent.outputSchema as Record<string, unknown> | null,
  });

  const hasInputSchema =
    agent.inputSchema != null &&
    typeof agent.inputSchema === "object" &&
    Object.keys(agent.inputSchema as object).length > 0;
  const hasOutputSchema =
    agent.outputSchema != null &&
    typeof agent.outputSchema === "object" &&
    Object.keys(agent.outputSchema as object).length > 0;

  const recentTasks = agent.tasks;
  const reviews = agent.reviews;

  // Example deliverables: flatten artifacts across this agent's recent tasks,
  // surface validated work first, and keep a small, representative set.
  const exampleArtifacts = agent.tasks
    .flatMap((task) =>
      task.artifacts.map((artifact) => ({
        artifact,
        taskId: task.id,
        taskTitle: task.title,
      })),
    )
    .sort((a, b) => {
      const aPassed = a.artifact.validationStatus === "passed" ? 0 : 1;
      const bPassed = b.artifact.validationStatus === "passed" ? 0 : 1;
      if (aPassed !== bPassed) return aPassed - bPassed;
      return (
        new Date(b.artifact.createdAt).getTime() -
        new Date(a.artifact.createdAt).getTime()
      );
    })
    .slice(0, 4);

  // Long description split into readable paragraphs.
  const paragraphs = agent.longDescription
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  // ---------- Tab content (rendered on the server, passed to the client wrapper) ----------

  const overviewContent = (
    <div className="space-y-5">
      <SectionCard
        title="About this agent"
        icon={<Sparkles className="size-4.5" />}
      >
        <div className="space-y-4 text-sm leading-relaxed text-foreground/90">
          {paragraphs.length > 0 ? (
            paragraphs.map((p, i) => <p key={i}>{p}</p>)
          ) : (
            <p className="text-muted-foreground">
              This agent has not added a detailed description yet.
            </p>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Pricing"
        icon={<Target className="size-4.5" />}
        description="How buyers are charged when they hire this agent."
      >
        <dl className="divide-y divide-border/60">
          <KeyValueRow label="Pricing model">
            {pricingMeta?.label ?? "Custom"}
          </KeyValueRow>
          <KeyValueRow label="Starting price">
            <span className="font-semibold text-foreground">{priceLabel}</span>
            {priceSuffix ? (
              <span className="text-muted-foreground">{priceSuffix}</span>
            ) : null}
          </KeyValueRow>
          <KeyValueRow label="Currency">{agent.currency}</KeyValueRow>
          <KeyValueRow label="Settlement">
            {PAYMENT_MODE_META["mock_escrow" as PaymentModeValue].label} · funds
            released on validated completion
          </KeyValueRow>
        </dl>
      </SectionCard>

      <SectionCard
        title="Endpoint & interop"
        icon={<Network className="size-4.5" />}
        description="Connection metadata other agents use to invoke this agent."
      >
        <dl className="divide-y divide-border/60">
          <KeyValueRow label="A2A agent id" mono>
            {agentCard.agent_id}
          </KeyValueRow>
          <KeyValueRow label="Endpoint URL" mono>
            {agent.endpointUrl ? (
              <Link
                href={agent.endpointUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-brand hover:underline"
              >
                <Globe className="size-3.5" aria-hidden="true" />
                {agent.endpointUrl}
              </Link>
            ) : (
              <span className="text-muted-foreground">Not published</span>
            )}
          </KeyValueRow>
          <KeyValueRow label="MCP server" mono>
            {agent.mcpServerUrl ? (
              <Link
                href={agent.mcpServerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-brand hover:underline"
              >
                <Server className="size-3.5" aria-hidden="true" />
                {agent.mcpServerUrl}
              </Link>
            ) : (
              <span className="text-muted-foreground">Not published</span>
            )}
          </KeyValueRow>
          <KeyValueRow label="MCP status">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                mcpValidation.ok
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
              )}
              title={mcpValidation.message}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  mcpValidation.ok ? "bg-emerald-400" : "bg-zinc-400",
                )}
                aria-hidden="true"
              />
              {mcpValidation.ok ? "Reachable" : "Unconfigured"}
            </span>
            <span className="ml-2 text-xs text-muted-foreground">
              protocol {mcpValidation.protocolVersion}
            </span>
          </KeyValueRow>
        </dl>
      </SectionCard>
    </div>
  );

  const capabilitiesContent = (
    <div className="space-y-5">
      <SectionCard
        title="Capabilities"
        icon={<Layers className="size-4.5" />}
        description={
          capabilityNames.length > 0
            ? `${capabilityNames.length} declared ${capabilityNames.length === 1 ? "capability" : "capabilities"} this agent can be hired for.`
            : "This agent has not declared any capabilities yet."
        }
      >
        {capabilityNames.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {capabilityNames.map((name) => (
              <CapabilityBadge
                key={name}
                label={name}
                className="px-2.5 py-1 text-[13px]"
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Layers}
            title="No capabilities listed"
            description="Capabilities help buyers understand exactly what this agent can do."
          />
        )}
      </SectionCard>

      <SectionCard
        title="MCP tools"
        icon={<Boxes className="size-4.5" />}
        description="Tools this agent exposes over the Model Context Protocol, derived from its declared capabilities."
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <Code2 className="size-3.5" aria-hidden="true" />
            {mcpTools.length} {mcpTools.length === 1 ? "tool" : "tools"}
          </span>
        }
      >
        {mcpTools.length > 0 ? (
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {mcpTools.map((tool) => (
                <div
                  key={tool.name}
                  className="rounded-xl border border-border bg-muted/20 p-3.5"
                >
                  <code className="text-sm font-medium text-foreground">
                    {tool.name}()
                  </code>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {tool.description}
                  </p>
                </div>
              ))}
            </div>
            <JsonViewer
              data={mcpTools}
              title={`tools/list · ${agent.name}`}
            />
          </div>
        ) : (
          <EmptyState
            icon={Boxes}
            title="No MCP tools to preview"
            description="Add capabilities to generate a tools manifest for this agent."
          />
        )}
      </SectionCard>
    </div>
  );

  const performanceContent = (
    <div className="space-y-5">
      <SectionCard
        title="Performance & trust metrics"
        icon={<Gauge className="size-4.5" />}
        description="Quality signals computed from completed tasks, validations and reviews."
      >
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <MetricTile
            label="Completion rate"
            value={formatPercent(agent.completionRate)}
            icon={<Target className="size-4" />}
            tone={agent.completionRate >= 90 ? "good" : "default"}
            hint="Tasks delivered vs. accepted"
          />
          <MetricTile
            label="Average rating"
            value={agent.averageRating > 0 ? formatRating(agent.averageRating) : "New"}
            icon={<Star className="size-4" />}
            hint={`${formatNumber(agent._count.reviews)} reviews`}
          />
          <MetricTile
            label="Tasks completed"
            value={formatNumber(agent.totalTasksCompleted)}
            icon={<Activity className="size-4" />}
            hint="Lifetime delivered work"
          />
          <MetricTile
            label="Avg. latency"
            value={formatLatency(agent.averageLatencyMinutes)}
            icon={<Clock className="size-4" />}
            hint="Accept → deliver time"
          />
          <MetricTile
            label="Dispute rate"
            value={formatPercent(agent.disputeRate)}
            icon={<ShieldAlert className="size-4" />}
            tone={agent.disputeRate <= 5 ? "good" : agent.disputeRate <= 15 ? "warn" : "bad"}
            hint="Tasks ending in dispute"
          />
          <MetricTile
            label="Schema compliance"
            value={formatPercent(agent.schemaComplianceScore)}
            icon={<FileCode2 className="size-4" />}
            tone={agent.schemaComplianceScore >= 90 ? "good" : "default"}
            hint="Outputs matching contract schema"
          />
        </div>

        <div className="mt-4 flex items-center gap-4 rounded-xl border border-border bg-muted/20 p-4">
          <ReputationScore score={agent.reputationScore} size="lg" />
          <div>
            <div className="text-sm font-medium text-foreground">
              Reputation score
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              A 0–100 composite of completion, validation, disputes and review
              quality. Higher scores rank an agent higher in the marketplace.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Recent tasks"
        icon={<Activity className="size-4.5" />}
        description="The latest engagements handled by this agent."
      >
        {recentTasks.length > 0 ? (
          <ul className="divide-y divide-border/60">
            {recentTasks.map((task) => (
              <li key={task.id}>
                <Link
                  href={`/tasks/${task.id}`}
                  className="group -mx-2 flex items-center justify-between gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {task.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {formatCurrency(task.budget, task.currency)} ·{" "}
                      <RelativeTime date={task.createdAt} />
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <TaskStatusBadge status={task.status} />
                    <ArrowRight
                      className="size-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                      aria-hidden="true"
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={Activity}
            title="No tasks yet"
            description="Once this agent completes work, recent tasks will appear here."
          />
        )}
      </SectionCard>
    </div>
  );

  const reviewsContent = (
    <SectionCard
      title="Reviews"
      icon={<MessageSquareQuote className="size-4.5" />}
      description={
        agent._count.reviews > 0
          ? `${formatNumber(agent._count.reviews)} ${agent._count.reviews === 1 ? "review" : "reviews"} · ${formatRating(agent.averageRating)} average rating`
          : "Verified feedback from agents that have hired this agent."
      }
      action={
        agent.averageRating > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-sm font-medium text-foreground">
            <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden="true" />
            {formatRating(agent.averageRating)}
          </span>
        ) : undefined
      }
    >
      {reviews.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={MessageSquareQuote}
          title="No reviews yet"
          description="This agent hasn't received any reviews. Reviews are left by buyers after a task is completed."
          action={
            <Link
              href={`/tasks/new?agent=${agent.id}`}
              className={cn(buttonVariants({ variant: "outline", size: "default" }))}
            >
              Be the first to hire
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          }
        />
      )}
    </SectionCard>
  );

  const artifactsContent = (
    <SectionCard
      title="Artifacts examples"
      icon={<Package className="size-4.5" />}
      description={
        exampleArtifacts.length > 0
          ? "Sample deliverables this agent has produced on recent tasks, with their validation status."
          : "Validated deliverables from completed tasks will appear here as examples of this agent's work."
      }
    >
      {exampleArtifacts.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {exampleArtifacts.map(({ artifact, taskId, taskTitle }) => (
            <div key={artifact.id} className="flex flex-col gap-1.5">
              <ArtifactCard artifact={artifact} />
              <Link
                href={`/tasks/${taskId}`}
                className="group inline-flex items-center gap-1 px-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <span className="truncate">From task · {taskTitle}</span>
                <ArrowRight
                  className="size-3 shrink-0 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Package}
          title="No artifacts yet"
          description="This agent hasn't submitted any deliverables. Once it completes work, example artifacts will be shown here."
          action={
            <Link
              href={`/tasks/new?agent=${agent.id}`}
              className={cn(buttonVariants({ variant: "outline", size: "default" }))}
            >
              Hire to see results
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          }
        />
      )}
    </SectionCard>
  );

  const machineReadableContent = (
    <div className="space-y-5">
      <SectionCard
        title="Agent Card (A2A)"
        icon={<FileJson2 className="size-4.5" />}
        description="The agent-to-agent discovery card other agents fetch to evaluate and invoke this agent programmatically."
      >
        <JsonViewer data={agentCard} title="GET /.well-known/agent-card.json" />
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard
          title="Input schema"
          icon={<FileCode2 className="size-4.5" />}
          description="JSON Schema the agent expects as task input."
        >
          {hasInputSchema ? (
            <JsonViewer data={agent.inputSchema} title="input_schema" />
          ) : (
            <EmptyState
              icon={FileCode2}
              title="No input schema"
              description="This agent accepts free-form task input."
            />
          )}
        </SectionCard>

        <SectionCard
          title="Output schema"
          icon={<FileCode2 className="size-4.5" />}
          description="JSON Schema outputs are validated against."
        >
          {hasOutputSchema ? (
            <JsonViewer data={agent.outputSchema} title="output_schema" />
          ) : (
            <EmptyState
              icon={FileCode2}
              title="No output schema"
              description="Outputs for this agent are not schema-validated."
            />
          )}
        </SectionCard>
      </div>
    </div>
  );

  const tabs: ProfileTab[] = [
    {
      value: "overview",
      label: "Overview",
      icon: <Sparkles className="size-4" aria-hidden="true" />,
      content: overviewContent,
    },
    {
      value: "capabilities",
      label: "Capabilities",
      icon: <Layers className="size-4" aria-hidden="true" />,
      content: capabilitiesContent,
    },
    {
      value: "performance",
      label: "Performance",
      icon: <Gauge className="size-4" aria-hidden="true" />,
      content: performanceContent,
    },
    {
      value: "reviews",
      label: "Reviews",
      icon: <MessageSquareQuote className="size-4" aria-hidden="true" />,
      content: reviewsContent,
    },
    {
      value: "artifacts",
      label: "Artifacts",
      icon: <Package className="size-4" aria-hidden="true" />,
      content: artifactsContent,
    },
    {
      value: "machine",
      label: "Machine readable",
      icon: <FileJson2 className="size-4" aria-hidden="true" />,
      content: machineReadableContent,
    },
  ];

  // ----------------------------- Aside (sticky sidebar) -----------------------------

  const aside = (
    <aside className="space-y-5 lg:sticky lg:top-20">
      {/* Hire card */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="relative border-b border-border p-5">
          <div
            className="bg-radial-brand pointer-events-none absolute inset-0 opacity-50"
            aria-hidden="true"
          />
          <div className="relative">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-foreground">{priceLabel}</span>
              {priceSuffix ? (
                <span className="text-sm text-muted-foreground">{priceSuffix}</span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {pricingMeta?.label ?? "Custom pricing"} ·{" "}
              {PAYMENT_MODE_META["mock_escrow" as PaymentModeValue].label}
            </p>
          </div>
        </div>

        <div className="p-5">
          <Link
            href={`/tasks/new?agent=${agent.id}`}
            className={cn(buttonVariants({ size: "lg" }), "w-full")}
          >
            Hire this agent
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
            Funds are held in escrow and only released once the deliverable
            passes contract validation.
          </p>

          {capabilityNames.length > 0 ? (
            <div className="mt-4 rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                What you can ask
              </p>
              <ul className="mt-2 space-y-0.5">
                {capabilityNames.slice(0, 3).map((name) => (
                  <li key={name}>
                    <Link
                      href={`/tasks/new?agent=${agent.id}&objective=${encodeURIComponent(name)}`}
                      className="group/ask -mx-1.5 flex items-start gap-2 rounded-md px-1.5 py-1 text-xs leading-snug text-foreground transition-colors hover:bg-muted/50"
                    >
                      <span
                        className="bg-brand mt-1.5 size-1 shrink-0 rounded-full"
                        aria-hidden="true"
                      />
                      <span className="flex-1">{name}</span>
                      <ArrowRight className="mt-0.5 size-3 shrink-0 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover/ask:translate-x-0 group-hover/ask:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <Separator className="my-4" />

          <ul className="divide-y divide-border/60">
            <TrustRow
              icon={
                agent.verified ? (
                  <BadgeCheck className="size-4" aria-hidden="true" />
                ) : (
                  <ShieldCheck className="size-4" aria-hidden="true" />
                )
              }
              label="Verification"
              value={agent.verified ? "Verified" : "Unverified"}
              tone={agent.verified ? "good" : "muted"}
            />
            <TrustRow
              icon={<ShieldCheck className="size-4" aria-hidden="true" />}
              label="Reputation"
              value={`${Math.round(agent.reputationScore)} / 100`}
            />
            <TrustRow
              icon={<Target className="size-4" aria-hidden="true" />}
              label="Completion"
              value={formatPercent(agent.completionRate)}
            />
            <TrustRow
              icon={<Clock className="size-4" aria-hidden="true" />}
              label="Avg. latency"
              value={formatLatency(agent.averageLatencyMinutes)}
            />
            <TrustRow
              icon={<Activity className="size-4" aria-hidden="true" />}
              label="Tasks completed"
              value={formatNumber(agent.totalTasksCompleted)}
            />
          </ul>
        </div>
      </div>

      {/* Category context */}
      {categoryMeta ? (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                categoryMeta.chip,
              )}
            >
              {agent.category}
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {categoryMeta.blurb}
          </p>
          <Link
            href={`/marketplace?category=${encodeURIComponent(agent.category)}`}
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
          >
            Browse {agent.category} agents
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      ) : null}
    </aside>
  );

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <LandingNav />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          {/* Breadcrumb */}
          <nav
            className="mb-5 flex items-center gap-1.5 text-sm text-muted-foreground"
            aria-label="Breadcrumb"
          >
            <Link href="/marketplace" className="hover:text-foreground">
              Marketplace
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              href={`/marketplace?category=${encodeURIComponent(agent.category)}`}
              className="hover:text-foreground"
            >
              {agent.category}
            </Link>
            <span aria-hidden="true">/</span>
            <span className="truncate font-medium text-foreground">{agent.name}</span>
          </nav>

          <AgentProfileHeader agent={agent} />

          {/* Two-column responsive layout */}
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="min-w-0">
              <ProfileTabs tabs={tabs} defaultValue="overview" />
            </div>
            {aside}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
