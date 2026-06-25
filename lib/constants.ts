/**
 * Shared, framework-agnostic vocabulary for Agent Market.
 *
 * IMPORTANT: This file is imported by BOTH server and client components, so it
 * must NOT import the Prisma client or any server-only module. The status string
 * unions below mirror the Prisma enums exactly (same string values) but are
 * declared independently so client bundles never pull in `@prisma/client`.
 */

// --- Default mock identity (kept in sync between seed + mock auth) ---
export const DEFAULT_ORG = {
  name: "Helix Labs",
  slug: "helix-labs",
  description:
    "A multi-agent operator running a fleet of autonomous specialists on Agent Market.",
} as const;

export const DEFAULT_USER = {
  email: process.env.MOCK_AUTH_EMAIL ?? "operator@agentmarket.dev",
  name: process.env.MOCK_AUTH_NAME ?? "Default Operator",
} as const;

// --- Categories ---
export const CATEGORIES = [
  "Growth",
  "Research",
  "Coding",
  "Data",
  "Design",
  "Operations",
  "Finance",
  "Security",
  "Customer Support",
  "Infrastructure",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface CategoryMeta {
  label: Category;
  /** lucide-react icon name (resolve via the `categoryIcon` helper in components). */
  icon: string;
  blurb: string;
  /** Tailwind classes for the category accent chip. */
  chip: string;
  iconBg: string;
  iconText: string;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  Growth: {
    label: "Growth",
    icon: "TrendingUp",
    blurb: "Lead gen, outbound, SEO and market expansion agents.",
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    iconBg: "bg-emerald-500/10",
    iconText: "text-emerald-400",
  },
  Research: {
    label: "Research",
    icon: "Microscope",
    blurb: "Source gathering, synthesis and citation-grade briefs.",
    chip: "border-violet-500/30 bg-violet-500/10 text-violet-400",
    iconBg: "bg-violet-500/10",
    iconText: "text-violet-400",
  },
  Coding: {
    label: "Coding",
    icon: "Code2",
    blurb: "Code review, test generation and bug detection.",
    chip: "border-sky-500/30 bg-sky-500/10 text-sky-400",
    iconBg: "bg-sky-500/10",
    iconText: "text-sky-400",
  },
  Data: {
    label: "Data",
    icon: "Database",
    blurb: "Cleaning, deduplication and schema mapping.",
    chip: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
    iconBg: "bg-cyan-500/10",
    iconText: "text-cyan-400",
  },
  Design: {
    label: "Design",
    icon: "PenTool",
    blurb: "UX audits, conversion reviews and copy critique.",
    chip: "border-pink-500/30 bg-pink-500/10 text-pink-400",
    iconBg: "bg-pink-500/10",
    iconText: "text-pink-400",
  },
  Operations: {
    label: "Operations",
    icon: "Workflow",
    blurb: "CRM sync, routing and back-office automation.",
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-400",
  },
  Finance: {
    label: "Finance",
    icon: "Landmark",
    blurb: "Categorization, cash-flow and variance analysis.",
    chip: "border-green-500/30 bg-green-500/10 text-green-400",
    iconBg: "bg-green-500/10",
    iconText: "text-green-400",
  },
  Security: {
    label: "Security",
    icon: "ShieldCheck",
    blurb: "Dependency audits, secret detection and vuln reports.",
    chip: "border-red-500/30 bg-red-500/10 text-red-400",
    iconBg: "bg-red-500/10",
    iconText: "text-red-400",
  },
  "Customer Support": {
    label: "Customer Support",
    icon: "Headset",
    blurb: "Ticket triage, response drafting and sentiment tagging.",
    chip: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    iconBg: "bg-blue-500/10",
    iconText: "text-blue-400",
  },
  Infrastructure: {
    label: "Infrastructure",
    icon: "Server",
    blurb: "Uptime checks, log summaries and incident reports.",
    chip: "border-orange-500/30 bg-orange-500/10 text-orange-400",
    iconBg: "bg-orange-500/10",
    iconText: "text-orange-400",
  },
};

// --- Pricing models (mirror PricingModel enum) ---
export const PRICING_MODELS = [
  "per_task",
  "subscription",
  "bounty",
  "free",
] as const;
export type PricingModelValue = (typeof PRICING_MODELS)[number];

export const PRICING_MODEL_META: Record<
  PricingModelValue,
  { label: string; suffix: string }
> = {
  per_task: { label: "Per task", suffix: "/task" },
  subscription: { label: "Subscription", suffix: "/mo" },
  bounty: { label: "Bounty", suffix: " bounty" },
  free: { label: "Free", suffix: "" },
};

// --- Payment modes (mirror PaymentMode enum) ---
export const PAYMENT_MODES = [
  "mock_escrow",
  "pay_per_task",
  "subscription",
  "bounty",
] as const;
export type PaymentModeValue = (typeof PAYMENT_MODES)[number];

export const PAYMENT_MODE_META: Record<
  PaymentModeValue,
  { label: string; description: string }
> = {
  mock_escrow: {
    label: "Mock escrow",
    description: "Funds are held in escrow and released on completion.",
  },
  pay_per_task: {
    label: "Pay per task",
    description: "Charged once when the task is accepted.",
  },
  subscription: {
    label: "Subscription access",
    description: "Recurring access to the agent's capabilities.",
  },
  bounty: {
    label: "Bounty",
    description: "Open reward paid to the first agent to deliver.",
  },
};

// --- Task statuses (mirror TaskStatus enum) ---
export const TASK_STATUSES = [
  "draft",
  "pending",
  "accepted",
  "running",
  "submitted",
  "validating",
  "completed",
  "disputed",
  "cancelled",
] as const;
export type TaskStatusValue = (typeof TASK_STATUSES)[number];

export interface StatusMeta {
  label: string;
  badge: string;
  dot: string;
  description: string;
}

export const TASK_STATUS_META: Record<TaskStatusValue, StatusMeta> = {
  draft: {
    label: "Draft",
    badge: "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
    dot: "bg-zinc-400",
    description: "Contract is being prepared and has not been published.",
  },
  pending: {
    label: "Pending",
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    dot: "bg-amber-400",
    description: "Awaiting the seller agent to accept the task.",
  },
  accepted: {
    label: "Accepted",
    badge: "border-sky-500/30 bg-sky-500/10 text-sky-400",
    dot: "bg-sky-400",
    description: "The agent has accepted and committed to the contract.",
  },
  running: {
    label: "Running",
    badge: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    dot: "bg-blue-400 animate-pulse",
    description: "The agent is actively executing the task.",
  },
  submitted: {
    label: "Submitted",
    badge: "border-indigo-500/30 bg-indigo-500/10 text-indigo-400",
    dot: "bg-indigo-400",
    description: "An artifact has been submitted for validation.",
  },
  validating: {
    label: "Validating",
    badge: "border-violet-500/30 bg-violet-500/10 text-violet-400",
    dot: "bg-violet-400 animate-pulse",
    description: "Output is being validated against the contract schema.",
  },
  completed: {
    label: "Completed",
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    dot: "bg-emerald-400",
    description: "Validated, accepted and payment released.",
  },
  disputed: {
    label: "Disputed",
    badge: "border-rose-500/30 bg-rose-500/10 text-rose-400",
    dot: "bg-rose-400",
    description: "The buyer has opened a dispute on the deliverable.",
  },
  cancelled: {
    label: "Cancelled",
    badge: "border-zinc-500/30 bg-zinc-500/10 text-zinc-500",
    dot: "bg-zinc-500",
    description: "The task was cancelled before completion.",
  },
};

/** The happy-path lifecycle used by TaskTimeline. */
export const TASK_STATUS_FLOW: TaskStatusValue[] = [
  "pending",
  "accepted",
  "running",
  "submitted",
  "validating",
  "completed",
];

// --- Payment statuses (mirror PaymentStatus enum) ---
export const PAYMENT_STATUSES = [
  "pending",
  "escrowed",
  "released",
  "refunded",
  "failed",
] as const;
export type PaymentStatusValue = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_META: Record<PaymentStatusValue, StatusMeta> = {
  pending: {
    label: "Pending",
    badge: "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
    dot: "bg-zinc-400",
    description: "Payment has not been initialized.",
  },
  escrowed: {
    label: "Escrowed",
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    dot: "bg-amber-400",
    description: "Funds are held in escrow pending completion.",
  },
  released: {
    label: "Released",
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    dot: "bg-emerald-400",
    description: "Funds released to the seller agent.",
  },
  refunded: {
    label: "Refunded",
    badge: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    dot: "bg-blue-400",
    description: "Funds returned to the buyer.",
  },
  failed: {
    label: "Failed",
    badge: "border-rose-500/30 bg-rose-500/10 text-rose-400",
    dot: "bg-rose-400",
    description: "The payment could not be processed.",
  },
};

// --- Validation statuses (mirror ValidationStatus enum) ---
export const VALIDATION_STATUSES = ["pending", "passed", "failed"] as const;
export type ValidationStatusValue = (typeof VALIDATION_STATUSES)[number];

export const VALIDATION_STATUS_META: Record<ValidationStatusValue, StatusMeta> = {
  pending: {
    label: "Pending",
    badge: "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
    dot: "bg-zinc-400",
    description: "Awaiting validation.",
  },
  passed: {
    label: "Passed",
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    dot: "bg-emerald-400",
    description: "Artifact passed schema + criteria validation.",
  },
  failed: {
    label: "Failed",
    badge: "border-rose-500/30 bg-rose-500/10 text-rose-400",
    dot: "bg-rose-400",
    description: "Artifact did not meet the validation threshold.",
  },
};

// --- Agent statuses (mirror AgentStatus enum) ---
export const AGENT_STATUSES = [
  "draft",
  "active",
  "suspended",
  "archived",
] as const;
export type AgentStatusValue = (typeof AGENT_STATUSES)[number];

export const AGENT_STATUS_META: Record<AgentStatusValue, StatusMeta> = {
  draft: {
    label: "Draft",
    badge: "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
    dot: "bg-zinc-400",
    description: "Listing not yet published.",
  },
  active: {
    label: "Active",
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    dot: "bg-emerald-400",
    description: "Listed and accepting tasks.",
  },
  suspended: {
    label: "Suspended",
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    dot: "bg-amber-400",
    description: "Temporarily delisted by an admin.",
  },
  archived: {
    label: "Archived",
    badge: "border-zinc-500/30 bg-zinc-500/10 text-zinc-500",
    dot: "bg-zinc-500",
    description: "Retired from the marketplace.",
  },
};

// --- Dispute statuses (mirror DisputeStatus enum) ---
export const DISPUTE_STATUSES = ["open", "resolved", "rejected"] as const;
export type DisputeStatusValue = (typeof DISPUTE_STATUSES)[number];

export const DISPUTE_STATUS_META: Record<DisputeStatusValue, StatusMeta> = {
  open: {
    label: "Open",
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    dot: "bg-amber-400",
    description: "Dispute is awaiting review.",
  },
  resolved: {
    label: "Resolved",
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    dot: "bg-emerald-400",
    description: "Dispute resolved in the buyer's or seller's favor.",
  },
  rejected: {
    label: "Rejected",
    badge: "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
    dot: "bg-zinc-400",
    description: "Dispute reviewed and rejected.",
  },
};

// --- Visibility (mirror Visibility enum) ---
export const VISIBILITY_OPTIONS = ["public", "private", "unlisted"] as const;
export type VisibilityValue = (typeof VISIBILITY_OPTIONS)[number];

export const VISIBILITY_META: Record<VisibilityValue, { label: string; description: string }> = {
  public: { label: "Public", description: "Visible to all agents in the marketplace." },
  private: { label: "Private", description: "Only visible to you and the target agent." },
  unlisted: { label: "Unlisted", description: "Accessible by direct link only." },
};

// --- Artifact types (mirror ArtifactType enum) ---
export const ARTIFACT_TYPES = ["file", "json", "text", "url", "report"] as const;
export type ArtifactTypeValue = (typeof ARTIFACT_TYPES)[number];

// --- Output format options used on the create-task form ---
export const OUTPUT_FORMATS = [
  "JSON",
  "CSV",
  "Markdown",
  "PDF report",
  "Plain text",
  "Structured data",
] as const;

export const VALIDATION_PASS_THRESHOLD = 80;
