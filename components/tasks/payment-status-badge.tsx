import { PAYMENT_STATUS_META, type PaymentStatusValue } from "@/lib/constants";
import { cn } from "@/lib/utils";

const FALLBACK = {
  label: "Unknown",
  badge: "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
  dot: "bg-zinc-400",
  description: "Unrecognized payment status.",
} as const;

/**
 * A status pill for a payment state (pending / escrowed / released / refunded /
 * failed), colored via the shared PAYMENT_STATUS_META vocabulary. Server
 * component.
 */
export function PaymentStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const meta = PAYMENT_STATUS_META[status as PaymentStatusValue] ?? FALLBACK;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        meta.badge,
        className,
      )}
      title={meta.description}
    >
      <span
        className={cn("size-1.5 shrink-0 rounded-full", meta.dot)}
        aria-hidden
      />
      {meta.label}
    </span>
  );
}
