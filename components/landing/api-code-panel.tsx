import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/shared/copy-button";

/**
 * Minimal, dependency-free JSON syntax highlighter for the API teaser.
 * Tokenizes a pretty-printed JSON string and wraps keys/strings/numbers/
 * literals in themed spans. Purely presentational; input is a static literal.
 */
function highlightJson(json: string): React.ReactNode[] {
  const tokenRegex =
    /("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|(\b-?\d+(?:\.\d+)?\b)|(\btrue\b|\bfalse\b|\bnull\b)/g;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(json)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <span key={key++} className="text-muted-foreground">
          {json.slice(lastIndex, match.index)}
        </span>,
      );
    }
    const [token, propKey, str, num, literal] = match;
    if (propKey) {
      nodes.push(
        <span key={key++} className="text-sky-300">
          {token}
        </span>,
      );
    } else if (str) {
      nodes.push(
        <span key={key++} className="text-emerald-300">
          {token}
        </span>,
      );
    } else if (num) {
      nodes.push(
        <span key={key++} className="text-amber-300">
          {token}
        </span>,
      );
    } else if (literal) {
      nodes.push(
        <span key={key++} className="text-violet-300">
          {token}
        </span>,
      );
    }
    lastIndex = tokenRegex.lastIndex;
  }
  if (lastIndex < json.length) {
    nodes.push(
      <span key={key++} className="text-muted-foreground">
        {json.slice(lastIndex)}
      </span>,
    );
  }
  return nodes;
}

interface ApiCodePanelProps {
  method?: string;
  path: string;
  body: unknown;
  className?: string;
}

export function ApiCodePanel({
  method = "POST",
  path,
  body,
  className,
}: ApiCodePanelProps) {
  const json = JSON.stringify(body, null, 2);
  const copyText = `${method} ${path}\n\n${json}`;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-[oklch(0.13_0.012_265)] shadow-2xl shadow-black/40",
        className,
      )}
    >
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-border/80 bg-black/20 px-4 py-3">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="size-3 rounded-full bg-red-500/70" />
          <span className="size-3 rounded-full bg-amber-500/70" />
          <span className="size-3 rounded-full bg-emerald-500/70" />
        </div>
        <span className="ml-2 font-mono text-xs text-muted-foreground">
          api.agentmarket.dev
        </span>
        <CopyButton value={copyText} label="Copy" className="ml-auto" />
      </div>

      {/* Request line */}
      <div className="flex items-center gap-2.5 border-b border-border/60 px-4 py-3 font-mono text-[13px]">
        <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-xs font-semibold text-emerald-400">
          {method}
        </span>
        <span className="truncate text-foreground">{path}</span>
      </div>

      {/* Body */}
      <pre className="no-scrollbar overflow-x-auto px-4 py-4 font-mono text-[13px] leading-relaxed">
        <code>{highlightJson(json)}</code>
      </pre>
    </div>
  );
}
