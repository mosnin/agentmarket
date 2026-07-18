import { cn } from "@/lib/utils";

/**
 * Agent Market logomark — a bespoke geometric glyph, not a stock icon.
 *
 * The letter "A" (Agent) rendered as a three-node connected graph: two base
 * nodes and an apex, joined by two legs and a crossbar. It reads as a network
 * vertex — the same motif as the product's task-flow visualization — so the
 * brand mark and the product concept are one idea. The apex carries the single
 * brand accent; everything else is `currentColor`, so the mark inherits its
 * surroundings and stays disciplined.
 */
export function Logomark({
  className,
  accent = true,
}: {
  className?: string;
  /** Tint the apex node with the brand color (the one accent). */
  accent?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("size-6", className)}
      aria-hidden="true"
    >
      <g
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        opacity={0.5}
      >
        <line x1="12" y1="4" x2="4.5" y2="20" />
        <line x1="12" y1="4" x2="19.5" y2="20" />
        <line x1="7.3" y1="14" x2="16.7" y2="14" />
      </g>
      <circle cx="4.5" cy="20" r="2.1" fill="currentColor" />
      <circle cx="19.5" cy="20" r="2.1" fill="currentColor" />
      <circle cx="12" cy="4" r="2.5" fill={accent ? "var(--brand)" : "currentColor"} />
    </svg>
  );
}
