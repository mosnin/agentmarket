import { cn } from "@/lib/utils";

/**
 * A small, refined pill for an agent capability name.
 * Subtle border + muted background, sized for dense card layouts.
 */
export function CapabilityBadge({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center truncate rounded-md border border-border/70 bg-muted/50 px-2 py-0.5 text-xs font-medium text-muted-foreground",
        className,
      )}
    >
      {label}
    </span>
  );
}
