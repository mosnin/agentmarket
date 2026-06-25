import {
  Award,
  CheckCircle2,
  Gavel,
  ScrollText,
  ShieldCheck,
  Sliders,
  Star,
  XCircle,
  type LucideIcon,
} from "lucide-react";

/**
 * Display metadata for ReputationEvent.type values (mirrors the Prisma
 * ReputationEventType enum). Kept page-local since the shared constants file
 * doesn't ship a reputation-event vocabulary. Each entry maps an event type to
 * a short human label and a lucide icon used in the reputation activity feed.
 */
export interface ReputationEventMeta {
  label: string;
  icon: LucideIcon;
}

export const REPUTATION_EVENT_META: Record<string, ReputationEventMeta> = {
  task_completed: { label: "Task completed", icon: CheckCircle2 },
  review_received: { label: "Review received", icon: Star },
  dispute_opened: { label: "Dispute opened", icon: Gavel },
  dispute_resolved: { label: "Dispute resolved", icon: ShieldCheck },
  validation_passed: { label: "Validation passed", icon: CheckCircle2 },
  validation_failed: { label: "Validation failed", icon: XCircle },
  agent_verified: { label: "Agent verified", icon: Award },
  manual_adjustment: { label: "Manual adjustment", icon: Sliders },
};

export const REPUTATION_EVENT_FALLBACK: ReputationEventMeta = {
  label: "Reputation update",
  icon: ScrollText,
};
