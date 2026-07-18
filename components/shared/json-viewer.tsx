"use client";

import * as React from "react";
import { Check, Copy, Maximize2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import {
  ExpandableScreen,
  ExpandableScreenTrigger,
  ExpandableScreenContent,
} from "@/components/ui/expandable-screen";

/** Lightweight, dependency-free JSON syntax tinting via regex tokenization. */
function highlight(json: string): React.ReactNode[] {
  // Match strings (incl. keys), booleans/null, and numbers.
  const tokenRe =
    /("(?:\\.|[^"\\])*"(?:\s*:)?)|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRe.exec(json)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(json.slice(lastIndex, match.index));
    }

    const [raw, str, keyword, num] = match;
    if (str !== undefined) {
      const isKey = str.trimEnd().endsWith(":");
      nodes.push(
        <span key={key++} className={isKey ? "text-chart-2" : "text-chart-3"}>
          {str}
        </span>,
      );
    } else if (keyword !== undefined) {
      nodes.push(
        <span key={key++} className="text-chart-5">
          {keyword}
        </span>,
      );
    } else if (num !== undefined) {
      nodes.push(
        <span key={key++} className="text-chart-4">
          {num}
        </span>,
      );
    } else {
      nodes.push(raw);
    }

    lastIndex = tokenRe.lastIndex;
  }

  if (lastIndex < json.length) {
    nodes.push(json.slice(lastIndex));
  }
  return nodes;
}

export function JsonViewer({
  data,
  title,
  className,
  expandable = false,
}: {
  data: unknown;
  title?: string;
  className?: string;
  /** Adds a tasteful "Expand" affordance that morphs the block to fullscreen. */
  expandable?: boolean;
}) {
  const [copied, setCopied] = React.useState(false);

  const json = React.useMemo(() => {
    try {
      return JSON.stringify(data, null, 2) ?? "null";
    } catch {
      return "// Unable to serialize value";
    }
  }, [data]);

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      toast.success("Copied JSON to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  }, [json]);

  const copyButton = (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copy JSON to clipboard"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium",
        "text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        "outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
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
          Copy
        </>
      )}
    </button>
  );

  const inline = (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-muted/30",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/40 px-3 py-2">
        <span className="truncate text-xs font-medium text-muted-foreground">
          {title ?? "JSON"}
        </span>
        <div className="flex items-center gap-1">
          {expandable ? (
            <ExpandableScreenTrigger>
              <span
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium",
                  "text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                )}
              >
                <Maximize2 className="size-3.5" aria-hidden="true" />
                Expand
              </span>
            </ExpandableScreenTrigger>
          ) : null}
          {copyButton}
        </div>
      </div>
      <pre className="no-scrollbar max-h-96 overflow-auto p-4 text-xs leading-relaxed">
        <code className="font-mono text-foreground/90">{highlight(json)}</code>
      </pre>
    </div>
  );

  if (!expandable) return inline;

  return (
    <ExpandableScreen
      layoutId={`json-${title ?? "viewer"}`}
      triggerRadius="12px"
      contentRadius="16px"
    >
      {inline}
      <ExpandableScreenContent
        className="bg-card shadow-2xl ring-1 ring-foreground/10"
        closeButtonClassName="text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <div className="flex h-full w-full flex-col">
          <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-3">
            <span className="truncate text-sm font-medium text-foreground">
              {title ?? "JSON"}
            </span>
            {copyButton}
          </div>
          <pre className="no-scrollbar flex-1 overflow-auto p-6 text-sm leading-relaxed">
            <code className="font-mono text-foreground/90">{highlight(json)}</code>
          </pre>
        </div>
      </ExpandableScreenContent>
    </ExpandableScreen>
  );
}
