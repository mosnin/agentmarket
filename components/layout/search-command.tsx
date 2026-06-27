"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Code2,
  FilePlus2,
  LayoutDashboard,
  Loader2,
  Package,
  PackagePlus,
  Search,
  Store,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

interface AgentResult {
  id: string;
  slug?: string;
  name: string;
  category?: string;
}

interface QuickNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
}

const QUICK_NAV: QuickNavItem[] = [
  {
    label: "Marketplace",
    href: "/marketplace",
    icon: Store,
    hint: "Browse agents",
  },
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    hint: "Your activity",
  },
  {
    label: "Seller Studio",
    href: "/seller",
    icon: Package,
    hint: "Manage listings",
  },
  {
    label: "Developers",
    href: "/developers",
    icon: Code2,
    hint: "API & protocols",
  },
];

// Primary actions — the verbs, surfaced first so the core jobs-to-be-done are a
// keystroke away, not buried behind navigation.
const ACTIONS: QuickNavItem[] = [
  {
    label: "Post a task",
    href: "/tasks/new",
    icon: FilePlus2,
    hint: "Hire an agent",
  },
  {
    label: "List an agent",
    href: "/agents/new",
    icon: PackagePlus,
    hint: "Sell on the marketplace",
  },
];

export function SearchCommand() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [agents, setAgents] = React.useState<AgentResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [errored, setErrored] = React.useState(false);
  const hasFetched = React.useRef(false);

  // ⌘K / Ctrl+K to open the palette anywhere on the page.
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }
      // "/" opens the palette — unless the user is typing into a field.
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const el = e.target as HTMLElement | null;
        const typing =
          el?.tagName === "INPUT" ||
          el?.tagName === "TEXTAREA" ||
          el?.tagName === "SELECT" ||
          el?.isContentEditable === true;
        if (!typing) {
          e.preventDefault();
          setOpen(true);
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Lazily load agents the first time the palette opens.
  React.useEffect(() => {
    if (!open || hasFetched.current) return;
    hasFetched.current = true;

    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setErrored(false);
      try {
        const res = await fetch("/api/agents", { signal: controller.signal });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const json: unknown = await res.json();
        const data =
          json && typeof json === "object" && Array.isArray((json as { data?: unknown }).data)
            ? ((json as { data: unknown[] }).data as Array<Record<string, unknown>>)
            : [];
        const normalized: AgentResult[] = data
          .filter((a) => a && typeof a === "object" && typeof a.name === "string")
          .map((a) => ({
            id: String(a.id ?? a.slug ?? a.name),
            slug: typeof a.slug === "string" ? a.slug : undefined,
            name: String(a.name),
            category: typeof a.category === "string" ? a.category : undefined,
          }));
        if (!cancelled) setAgents(normalized);
      } catch (err) {
        // AbortError on unmount is expected — only surface real failures.
        if (!cancelled && (err as Error).name !== "AbortError") {
          setErrored(true);
          // Allow a retry on the next open.
          hasFetched.current = false;
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [open]);

  const go = React.useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search agents"
        className={cn(
          "group inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-muted/40 px-2.5 text-sm text-muted-foreground transition-colors",
          "hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          "w-9 justify-center sm:w-56 sm:justify-start dark:bg-input/30 dark:hover:bg-input/50",
        )}
      >
        <Search className="size-4 shrink-0" />
        <span className="hidden flex-1 text-left sm:inline">Search agents…</span>
        <kbd className="ml-auto hidden items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
          <span className="text-[11px]">⌘</span>K
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search Agent Market"
        description="Find agents and jump to any section of the marketplace."
      >
        <Command shouldFilter>
          <CommandInput placeholder="Search agents or jump to…" />
          <CommandList>
            <CommandEmpty>
              {loading
                ? "Loading agents…"
                : errored
                  ? "Couldn't load agents. Try again."
                  : "No results found."}
            </CommandEmpty>

            <CommandGroup heading="Actions">
              {ACTIONS.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.href}
                    value={`${item.label} ${item.hint}`}
                    onSelect={() => go(item.href)}
                  >
                    <Icon className="text-muted-foreground" />
                    <span>{item.label}</span>
                    <CommandShortcut>{item.hint}</CommandShortcut>
                  </CommandItem>
                );
              })}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Go to">
              {QUICK_NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.href}
                    value={`${item.label} ${item.hint}`}
                    onSelect={() => go(item.href)}
                  >
                    <Icon className="text-muted-foreground" />
                    <span>{item.label}</span>
                    <CommandShortcut>{item.hint}</CommandShortcut>
                  </CommandItem>
                );
              })}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup
              heading={
                loading
                  ? "Agents · loading…"
                  : agents.length > 0
                    ? `Agents · ${agents.length}`
                    : "Agents"
              }
            >
              {loading && agents.length === 0 ? (
                <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Fetching agents…
                </div>
              ) : (
                agents.map((agent) => (
                  <CommandItem
                    key={agent.id}
                    value={`${agent.name} ${agent.category ?? ""} ${agent.slug ?? ""}`}
                    onSelect={() => go(`/agents/${agent.slug ?? agent.id}`)}
                  >
                    <Store className="text-muted-foreground" />
                    <span className="truncate">{agent.name}</span>
                    {agent.category ? (
                      <CommandShortcut>{agent.category}</CommandShortcut>
                    ) : null}
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
