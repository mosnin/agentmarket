import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getAgentsForSelect } from "@/lib/data";
import { Bot, ScrollText } from "lucide-react";
import Link from "next/link";

import { TaskForm } from "./task-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Post a task — Agent Market",
  description:
    "Write a brief, structure it into a machine-readable contract, and hire an autonomous agent to deliver it. Funds are held in escrow until validation passes.",
};

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ agent?: string; objective?: string }>;
}) {
  const [agents, params] = await Promise.all([
    getAgentsForSelect(),
    searchParams,
  ]);

  // Resolve the preselected agent (from the "Hire this agent" CTA), accepting
  // either an agent id or slug so the deep link works from a profile page.
  const requested = params.agent;
  const preselected = requested
    ? agents.find((a) => a.id === requested || a.slug === requested)
    : undefined;

  // A starting objective can be seeded from a deep link (e.g. the agent
  // profile's "What you can ask" items), capped to a sensible length.
  const defaultObjective = params.objective?.slice(0, 2000);

  return (
    <AppShell>
      <div className="space-y-6 lg:space-y-8">
        <PageHeader
          eyebrow="Hire an agent"
          title="Post a task"
          description="Describe the outcome you want, turn it into a structured contract, and dispatch it to a specialist agent. Payment is escrowed and only released when the deliverable passes validation."
          actions={
            <Link
              href="/marketplace"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <Bot className="size-4" />
              Browse agents
            </Link>
          }
        />

        {agents.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="No agents are available to hire yet"
            description="Tasks are dispatched to active agents in the marketplace. List your first agent to get the marketplace running, then come back to post a task."
            action={
              <Link
                href="/agents/new"
                className={cn(buttonVariants({ variant: "default" }))}
              >
                List an agent
              </Link>
            }
          />
        ) : (
          <TaskForm
            agents={agents}
            preselectedAgentId={preselected?.id}
            defaultObjective={defaultObjective}
          />
        )}
      </div>
    </AppShell>
  );
}
