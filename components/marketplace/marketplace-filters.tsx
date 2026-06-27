"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";

import {
  CATEGORIES,
  PRICING_MODELS,
  PRICING_MODEL_META,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "all";

type Option = { label: string; value: string };

const CATEGORY_OPTIONS: Option[] = [
  { label: "All categories", value: ALL },
  ...CATEGORIES.map((c) => ({ label: c, value: c })),
];

const PRICING_OPTIONS: Option[] = [
  { label: "Any pricing", value: ALL },
  ...PRICING_MODELS.map((p) => ({ label: PRICING_MODEL_META[p].label, value: p })),
];

const RATING_OPTIONS: Option[] = [
  { label: "Any rating", value: ALL },
  { label: "3.0+ stars", value: "3" },
  { label: "4.0+ stars", value: "4" },
  { label: "4.5+ stars", value: "4.5" },
];

const SORT_OPTIONS: Option[] = [
  { label: "Top reputation", value: "reputation" },
  { label: "Highest rated", value: "rating" },
  { label: "Lowest price", value: "price" },
  { label: "Completion rate", value: "completion" },
  { label: "Newest", value: "newest" },
];

const DEFAULT_SORT = "reputation";

function FilterSelect({
  label,
  value,
  options,
  placeholder,
  onChange,
  className,
}: {
  label: string;
  value: string;
  options: Option[];
  placeholder: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <Select
      items={options}
      value={value}
      onValueChange={(next) => onChange((next as string | null) ?? ALL)}
    >
      <SelectTrigger
        aria-label={label}
        className={cn("h-9 w-full bg-background dark:bg-input/30", className)}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function MarketplaceFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Current values derived from the URL.
  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? ALL;
  const pricing = searchParams.get("pricing") ?? ALL;
  const rating = searchParams.get("rating") ?? ALL;
  const verified = searchParams.get("verified") === "true";
  const sort = searchParams.get("sort") ?? DEFAULT_SORT;

  const [searchValue, setSearchValue] = React.useState(q);

  // Keep the local input in sync if the URL changes externally (e.g. Clear).
  React.useEffect(() => {
    setSearchValue(q);
  }, [q]);

  const setParam = React.useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === "" || value === ALL) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  // Debounced search push (~300ms).
  React.useEffect(() => {
    if (searchValue === q) return;
    const id = setTimeout(() => setParam("q", searchValue.trim()), 300);
    return () => clearTimeout(id);
  }, [searchValue, q, setParam]);

  const hasActiveFilters =
    q !== "" ||
    category !== ALL ||
    pricing !== ALL ||
    rating !== ALL ||
    verified ||
    sort !== DEFAULT_SORT;

  const clearAll = React.useCallback(() => {
    setSearchValue("");
    router.push(pathname, { scroll: false });
  }, [pathname, router]);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-4">
        {/* Search */}
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            enterKeyHint="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search agents, capabilities, descriptions…"
            aria-label="Search agents"
            className="h-10 pl-9"
          />
        </div>

        {/* Selects grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FilterSelect
            label="Filter by category"
            value={category}
            options={CATEGORY_OPTIONS}
            placeholder="All categories"
            onChange={(v) => setParam("category", v)}
          />
          <FilterSelect
            label="Filter by pricing model"
            value={pricing}
            options={PRICING_OPTIONS}
            placeholder="Any pricing"
            onChange={(v) => setParam("pricing", v)}
          />
          <FilterSelect
            label="Filter by minimum rating"
            value={rating}
            options={RATING_OPTIONS}
            placeholder="Any rating"
            onChange={(v) => setParam("rating", v)}
          />
          <FilterSelect
            label="Sort agents"
            value={sort}
            options={SORT_OPTIONS}
            placeholder="Sort by"
            onChange={(v) => setParam("sort", v === DEFAULT_SORT ? null : v)}
          />
        </div>

        {/* Verified toggle + clear */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <Switch
              checked={verified}
              onCheckedChange={(checked) => setParam("verified", checked ? "true" : null)}
              aria-label="Show verified agents only"
            />
            <span className="font-medium text-foreground">Verified only</span>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Trusted, audited agents
            </span>
          </label>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <SlidersHorizontal className="size-3.5" aria-hidden="true" />
              {hasActiveFilters ? "Filters active" : "No filters"}
            </span>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearAll}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
                  "text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  "outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                )}
              >
                <X className="size-3.5" aria-hidden="true" />
                Clear
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
