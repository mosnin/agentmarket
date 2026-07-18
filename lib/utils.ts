import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as USD currency. */
export function formatCurrency(
  amount: number,
  currency = "USD",
  opts: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    ...opts,
  }).format(amount);
}

/** Compact number formatting: 1200 -> 1.2k */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/** Format a 0-100 percentage value. */
export function formatPercent(value: number, fractionDigits = 0): string {
  return `${value.toFixed(fractionDigits)}%`;
}

/** Format a rating like 4.8 */
export function formatRating(value: number): string {
  return value.toFixed(1);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/** Latency in minutes -> human string. */
export function formatLatency(minutes: number): string {
  if (minutes <= 0) return "—";
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = minutes / 60;
  if (hours < 24) return `${hours.toFixed(hours % 1 === 0 ? 0 : 1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

/**
 * A performance rate for display, degraded to an em dash when there's no
 * evidence behind it. A brand-new agent has these scores at their 0 default;
 * rendering "0%" would misread "no track record" as total failure (or, for
 * dispute rate, falsely reward a clean record), so with no task history
 * (`taskCount === 0`) it shows "—". Genuine rates (the agent has tasks) are
 * shown as-is, so real performance — good or bad — is never hidden.
 */
export function formatRateOrDash(rate: number, taskCount: number): string {
  return taskCount > 0 ? formatPercent(rate) : "—";
}

export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Relative time: "2h ago", "in 3d". */
export function formatRelativeTime(date: Date | string | number): string {
  const d = new Date(date).getTime();
  const now = Date.now();
  const diff = d - now;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 1000 * 60 * 60 * 24 * 365],
    ["month", 1000 * 60 * 60 * 24 * 30],
    ["day", 1000 * 60 * 60 * 24],
    ["hour", 1000 * 60 * 60],
    ["minute", 1000 * 60],
    ["second", 1000],
  ];
  for (const [unit, ms] of units) {
    if (abs >= ms || unit === "second") {
      return rtf.format(Math.round(diff / ms), unit);
    }
  }
  return "just now";
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Deterministic 32-bit hash of a string (used for mock contract hashes / scores). */
export function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Stable pseudo "0x..." hash string for mock transactions / contracts. */
export function mockHash(prefix: string, seed: string): string {
  const h = hashString(seed).toString(16).padStart(8, "0");
  const h2 = hashString(seed.split("").reverse().join(""))
    .toString(16)
    .padStart(8, "0");
  return `${prefix}${h}${h2}${h.slice(0, 4)}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function truncate(value: string, length = 120): string {
  if (value.length <= length) return value;
  return value.slice(0, length).trimEnd() + "…";
}

export function pluralize(count: number, singular: string, plural?: string) {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}
