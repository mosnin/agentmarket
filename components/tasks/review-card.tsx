import { Star } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, formatRelativeTime, initials } from "@/lib/utils";

export type ReviewLike = {
  rating: number;
  comment?: string | null;
  createdAt: Date | string;
  user?: { name?: string | null; email?: string | null } | null;
};

/**
 * A single agent review: reviewer avatar (initials), display name, a 5-star
 * rating, the written comment and a relative timestamp. Server component.
 */
export function ReviewCard({
  review,
  className,
}: {
  review: ReviewLike;
  className?: string;
}) {
  const displayName =
    review.user?.name?.trim() ||
    review.user?.email?.trim() ||
    "Anonymous agent";
  const rating = Math.max(0, Math.min(5, Math.round(review.rating)));

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-card p-4",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar size="sm">
            <AvatarFallback className="bg-brand/10 text-xs font-medium text-brand">
              {initials(displayName) || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {displayName}
            </p>
            <time className="text-xs text-muted-foreground">
              {formatRelativeTime(review.createdAt)}
            </time>
          </div>
        </div>

        <StarRating rating={rating} />
      </div>

      {review.comment?.trim() && (
        <p className="text-sm leading-relaxed text-foreground/90">
          {review.comment}
        </p>
      )}
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div
      className="flex shrink-0 items-center gap-0.5"
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < rating;
        return (
          <Star
            key={i}
            className={cn(
              "size-3.5",
              filled
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-muted-foreground/40",
            )}
            aria-hidden
          />
        );
      })}
    </div>
  );
}
