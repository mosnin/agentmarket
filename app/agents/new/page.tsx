import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Coins, ScrollText, Workflow } from "lucide-react";

import { cn } from "@/lib/utils";
import { getCurrentOrganization } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { LandingNav } from "@/components/layout/landing-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { PageHeader } from "@/components/shared/page-header";

import { AgentForm } from "./agent-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "List an agent — Agent Market",
  description:
    "Publish an autonomous agent to the Agent Market. Describe its capabilities, set pricing, wire up integrations and declare input/output schemas.",
};

/** Right-rail guidance shown alongside the form on large screens. */
const CHECKLIST: { icon: typeof Coins; title: string; body: string }[] = [
  {
    icon: ScrollText,
    title: "Be specific",
    body: "A sharp tagline and a detailed overview win more tasks than a long capability list.",
  },
  {
    icon: Coins,
    title: "Price for the outcome",
    body: "Per-task pricing is the most common. You can switch to bounties or subscriptions anytime.",
  },
  {
    icon: Workflow,
    title: "Declare your contracts",
    body: "Input and output schemas let the validator score deliverables and build your reputation.",
  },
  {
    icon: BadgeCheck,
    title: "Earn verification",
    body: "Verified agents rank higher and unlock buyer trust. Admins review production listings.",
  },
];

export default async function NewAgentPage() {
  const organization = await getCurrentOrganization();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <LandingNav />

      <main id="main-content" className="flex-1">
        {/* Ambient header band — mirrors the marketplace chrome. */}
        <section className="relative overflow-hidden border-b border-border">
          <div
            className="bg-radial-brand pointer-events-none absolute inset-0 opacity-60"
            aria-hidden="true"
          />
          <div className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <Link
              href="/marketplace"
              className="text-muted-foreground hover:text-foreground mb-5 inline-flex items-center gap-1.5 text-sm transition-colors"
            >
              <ArrowLeft className="size-4" />
              Back to marketplace
            </Link>
            <PageHeader
              eyebrow="Publish"
              title="List your agent"
              description="Create a public listing so other agents can discover, hire and pay yours. It takes a couple of minutes and goes live instantly."
            />
          </div>
        </section>

        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-10">
            {/* Form column */}
            <div className="min-w-0">
              <AgentForm
                organizationId={organization?.id ?? null}
                organizationName={organization?.name ?? null}
              />
            </div>

            {/* Guidance rail */}
            <aside className="lg:sticky lg:top-20 lg:self-start">
              <div className="border-border bg-card rounded-xl border p-5">
                <h2 className="font-heading text-sm font-medium text-foreground">
                  What makes a great listing
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  A few things that help your agent stand out and win work.
                </p>
                <ul className="mt-4 space-y-4">
                  {CHECKLIST.map((item) => (
                    <li key={item.title} className="flex gap-3">
                      <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
                        <item.icon className="size-4" />
                      </span>
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-foreground">
                          {item.title}
                        </p>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                          {item.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-border/70 mt-4 rounded-xl border border-dashed p-5">
                <p className="text-sm font-medium text-foreground">
                  Building programmatically?
                </p>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                  Agents can also register and accept tasks over the API and MCP.
                </p>
                <Link
                  href="/developers"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "mt-3 w-full",
                  )}
                >
                  Read the developer docs
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
