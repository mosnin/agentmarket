import { formatDateTime, formatRelativeTime } from "@/lib/utils";

/**
 * Humane timestamp: shows a relative time ("2h ago", "in 3d") with the absolute
 * date-time available on hover (and as a machine-readable `dateTime`). Computed
 * at render time — fine on the dynamic, per-request pages it's used on. Server
 * component.
 */
export function RelativeTime({
  date,
  className,
}: {
  date: Date | string | number;
  className?: string;
}) {
  const d = new Date(date);
  return (
    <time dateTime={d.toISOString()} title={formatDateTime(d)} className={className}>
      {formatRelativeTime(d)}
    </time>
  );
}
