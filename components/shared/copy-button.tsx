"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Small, reusable copy-to-clipboard control. Copies `value`, then confirms
 * inline with a check + "Copied" for ~1.5s. Fails silently when the Clipboard
 * API is unavailable (e.g. a non-secure context). Client component.
 */
export function CopyButton({
  value,
  label = "Copy",
  srLabel,
  className,
}: {
  value: string;
  label?: string;
  /** Accessible name, when the visible `label` isn't descriptive on its own
   *  (e.g. a truncated hash). Falls back to `label`. */
  srLabel?: string;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable — nothing useful to do; leave state unchanged.
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={copied ? "Copied" : (srLabel ?? label)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-card/40 px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
        className,
      )}
    >
      {copied ? (
        <>
          <Check className="size-3.5 text-success" aria-hidden="true" />
          Copied
        </>
      ) : (
        <>
          <Copy className="size-3.5" aria-hidden="true" />
          {label}
        </>
      )}
    </button>
  );
}
