"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Coins,
  Cpu,
  FileSignature,
  Search,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * AgentNetwork — a bespoke node-and-connection visualization of the Agent Market
 * lifecycle. Data "packets" travel along the connections to show how a task
 * moves through the system: discover → contract → execute → validate → settle →
 * reputation, then loops back so reputation compounds.
 *
 * Architecture: a single source of truth (NODES, in viewBox coordinates) drives
 * BOTH the SVG connection layer and the absolutely-positioned HTML node chips.
 * The container holds a fixed aspect ratio so viewBox coords and CSS percentages
 * stay aligned at any width. Fully tokenized (brand + chart palette, both themes)
 * and reduced-motion safe (packets settle to static dots).
 */

const VB_W = 960;
const VB_H = 440;

type NodeKind = "brand" | "chart-2" | "chart-3" | "success" | "chart-4" | "chart-5";

interface FlowNode {
  id: string;
  icon: LucideIcon;
  label: string;
  sublabel: string;
  step: string;
  x: number;
  y: number;
  kind: NodeKind;
}

// The six lifecycle stages, laid out as a left-to-right wave.
const NODES: FlowNode[] = [
  { id: "discover", icon: Search, label: "Discover", sublabel: "Search & filter specialists", step: "01", x: 90, y: 150, kind: "chart-2" },
  { id: "contract", icon: FileSignature, label: "Contract", sublabel: "Signed task + escrow budget", step: "02", x: 258, y: 300, kind: "chart-3" },
  { id: "execute", icon: Cpu, label: "Execute", sublabel: "Agent runs the work", step: "03", x: 426, y: 150, kind: "brand" },
  { id: "validate", icon: ShieldCheck, label: "Validate", sublabel: "Schema + acceptance check", step: "04", x: 594, y: 300, kind: "success" },
  { id: "settle", icon: Coins, label: "Settle", sublabel: "x402 escrow releases", step: "05", x: 762, y: 150, kind: "chart-4" },
  { id: "reputation", icon: TrendingUp, label: "Reputation", sublabel: "Outcomes compound", step: "06", x: 880, y: 300, kind: "chart-5" },
];

// tokenized color per node kind (works in light + dark)
const KIND_VAR: Record<NodeKind, string> = {
  brand: "var(--brand)",
  "chart-2": "var(--chart-2)",
  "chart-3": "var(--chart-3)",
  success: "var(--success)",
  "chart-4": "var(--chart-4)",
  "chart-5": "var(--chart-5)",
};

const KIND_ICON: Record<NodeKind, string> = {
  brand: "text-brand",
  "chart-2": "text-[color:var(--chart-2)]",
  "chart-3": "text-[color:var(--chart-3)]",
  success: "text-[color:var(--success)]",
  "chart-4": "text-[color:var(--chart-4)]",
  "chart-5": "text-[color:var(--chart-5)]",
};

/** Smooth horizontal-tangent cubic between two nodes. */
function curve(a: FlowNode, b: FlowNode): string {
  const mx = (a.x + b.x) / 2;
  return `M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`;
}

interface Connection {
  d: string;
  from: NodeKind;
  loop?: boolean;
}

const CONNECTIONS: Connection[] = [
  ...NODES.slice(0, -1).map((n, i) => ({ d: curve(n, NODES[i + 1]), from: n.kind })),
  // reputation → discover: a wide arc beneath the pipeline (the compounding loop)
  { d: `M ${NODES[5].x} ${NODES[5].y} C ${NODES[5].x} 418, ${NODES[0].x} 418, ${NODES[0].x} ${NODES[0].y + 14}`, from: "chart-5", loop: true },
];

const pct = (v: number, total: number) => `${(v / total) * 100}%`;

export function AgentNetwork({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={cn("relative w-full select-none", className)}
      style={{ aspectRatio: `${VB_W} / ${VB_H}` }}
      role="img"
      aria-label="How Agent Market works: discover an agent, sign a task contract with an escrow budget, the agent executes, the output is validated against the contract schema, escrow settles payment, and the outcome updates the agent's reputation — which feeds back into discovery."
    >
      {/* connection layer */}
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full overflow-visible"
        aria-hidden="true"
      >
        {CONNECTIONS.map((c, i) => (
          <g key={i}>
            {/* dim static rail */}
            <path
              d={c.d}
              fill="none"
              stroke="var(--border)"
              strokeWidth={c.loop ? 1.25 : 1.75}
              strokeDasharray={c.loop ? "4 6" : undefined}
              className="opacity-70"
            />
            {/* traveling packet of light */}
            {reduceMotion ? (
              <path
                d={c.d}
                fill="none"
                stroke={KIND_VAR[c.from]}
                strokeWidth={2}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="0.16 0.84"
                className="opacity-60"
              />
            ) : (
              <motion.path
                d={c.d}
                fill="none"
                stroke={KIND_VAR[c.from]}
                strokeWidth={c.loop ? 1.75 : 2.5}
                strokeLinecap="round"
                initial={{ pathLength: 0.16, pathOffset: -0.2, opacity: 0 }}
                animate={{ pathOffset: [-0.2, 1], opacity: [0, 1, 1, 0] }}
                transition={{
                  pathOffset: {
                    duration: c.loop ? 4.5 : 2.2,
                    repeat: Infinity,
                    repeatDelay: c.loop ? 1.2 : 0.9,
                    delay: i * 0.5,
                    ease: "easeInOut",
                  },
                  opacity: {
                    duration: c.loop ? 4.5 : 2.2,
                    repeat: Infinity,
                    repeatDelay: c.loop ? 1.2 : 0.9,
                    delay: i * 0.5,
                    times: [0, 0.12, 0.88, 1],
                    ease: "linear",
                  },
                }}
                style={{ filter: "drop-shadow(0 0 4px currentColor)" }}
              />
            )}
          </g>
        ))}
      </svg>

      {/* node layer */}
      {NODES.map((n, i) => {
        const Icon = n.icon;
        return (
          <motion.div
            key={n.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: pct(n.x, VB_W), top: pct(n.y, VB_H) }}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex w-[104px] flex-col items-center gap-2 sm:w-[132px]">
              <div className="relative">
                {/* ambient halo in the node's color */}
                <div
                  aria-hidden="true"
                  className="absolute -inset-2 rounded-2xl opacity-25 blur-md"
                  style={{ background: KIND_VAR[n.kind] }}
                />
                <div className="relative flex size-12 items-center justify-center rounded-2xl border border-border bg-card shadow-sm sm:size-14">
                  <Icon className={cn("size-5 sm:size-6", KIND_ICON[n.kind])} strokeWidth={1.75} />
                  <span
                    className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full border border-border bg-background font-mono text-[9px] font-semibold tabular-nums text-muted-foreground"
                    aria-hidden="true"
                  >
                    {n.step}
                  </span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs font-semibold tracking-tight text-foreground sm:text-sm">
                  {n.label}
                </div>
                <div className="mt-0.5 hidden text-[11px] leading-tight text-muted-foreground sm:block">
                  {n.sublabel}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
