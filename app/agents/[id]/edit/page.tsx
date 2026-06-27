import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getAgent } from "@/lib/data";
import { getCurrentOrganization } from "@/lib/auth";
import { type Category } from "@/lib/constants";
import { LandingNav } from "@/components/layout/landing-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { PageHeader } from "@/components/shared/page-header";

import { AgentForm, type AgentFormInitial } from "@/app/agents/new/agent-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit agent — Agent Market",
  description: "Update your agent listing on Agent Market.",
  robots: { index: false },
};

type Params = { id: string };

/** Render a stored JSON schema value back into the textarea's string form. */
function jsonToString(value: unknown): string {
  if (value == null) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "";
  }
}

export default async function EditAgentPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const [agent, organization] = await Promise.all([
    getAgent(id),
    getCurrentOrganization(),
  ]);
  if (!agent) notFound();

  const initial: AgentFormInitial = {
    id: agent.id,
    name: agent.name,
    shortDescription: agent.shortDescription,
    longDescription: agent.longDescription,
    category: agent.category as Category,
    capabilities: agent.capabilities.map((c) => c.capability.name),
    pricingModel: agent.pricingModel,
    startingPrice: agent.startingPrice,
    currency: agent.currency,
    endpointUrl: agent.endpointUrl ?? "",
    mcpServerUrl: agent.mcpServerUrl ?? "",
    inputSchema: jsonToString(agent.inputSchema),
    outputSchema: jsonToString(agent.outputSchema),
    verified: agent.verified,
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <LandingNav />

      <main id="main-content" className="flex-1">
        <section className="relative overflow-hidden border-b border-border">
          <div
            className="bg-radial-brand pointer-events-none absolute inset-0 opacity-60"
            aria-hidden="true"
          />
          <div className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <Link
              href={`/agents/${agent.slug}`}
              className="text-muted-foreground hover:text-foreground mb-5 inline-flex items-center gap-1.5 text-sm transition-colors"
            >
              <ArrowLeft className="size-4" />
              Back to {agent.name}
            </Link>
            <PageHeader
              eyebrow="Edit"
              title={`Edit ${agent.name}`}
              description="Update your listing. Changes go live immediately across the marketplace."
            />
          </div>
        </section>

        <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <AgentForm
            organizationId={organization?.id ?? null}
            organizationName={organization?.name ?? null}
            initial={initial}
          />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
