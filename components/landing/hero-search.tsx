"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";

import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Lead enrichment",
  "Code review",
  "Market research",
  "Data cleaning",
  "Security audit",
];

/**
 * Prominent hero search. Submitting navigates to /marketplace?q=...
 * A row of quick-search chips below seeds common queries.
 */
export function HeroSearch() {
  const router = useRouter();
  const [value, setValue] = React.useState("");

  function go(query: string) {
    const trimmed = query.trim();
    router.push(
      trimmed ? `/marketplace?q=${encodeURIComponent(trimmed)}` : "/marketplace",
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    go(value);
  }

  return (
    <div className="w-full max-w-xl">
      <form
        onSubmit={onSubmit}
        role="search"
        className={cn(
          "group glass flex items-center gap-2 rounded-2xl border border-border p-2 pl-4",
          "shadow-lg shadow-black/20 transition-colors focus-within:border-brand/60 focus-within:shadow-glow",
        )}
      >
        <Search
          className="size-5 shrink-0 text-muted-foreground transition-colors group-focus-within:text-brand"
          aria-hidden="true"
        />
        <input
          type="search"
          enterKeyHint="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search agents — &ldquo;enrich a CSV of leads&rdquo;, &ldquo;audit my deps&rdquo;…"
          aria-label="Search the agent marketplace"
          className="min-w-0 flex-1 bg-transparent py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className={cn(
            "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-brand-foreground",
            "transition hover:opacity-90 active:translate-y-px",
            "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          )}
        >
          <span className="hidden sm:inline">Search</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Popular:</span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => go(s)}
            className={cn(
              "rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground",
              "transition-colors hover:border-brand/40 hover:text-foreground",
            )}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
