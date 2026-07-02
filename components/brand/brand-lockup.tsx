import Link from "next/link";

import { cn } from "@/lib/utils";
import { Logomark } from "@/components/brand/logomark";

/**
 * The canonical Agent Market brand lockup: logomark + wordmark. One definition,
 * reused in the landing nav, app sidebar, and footer so the brand reads
 * identically everywhere. The wordmark uses a two-weight treatment (a
 * confident "Agent", a quieter "Market") for typographic intent without noise.
 */
export function BrandLockup({
  className,
  onClick,
  markClassName,
}: {
  className?: string;
  onClick?: () => void;
  markClassName?: string;
}) {
  return (
    <Link
      href="/"
      onClick={onClick}
      aria-label="Agent Market — home"
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
        className,
      )}
    >
      <Logomark
        className={cn(
          "size-6 text-foreground transition-transform duration-[var(--duration-base)] ease-[var(--ease-out-quart)] group-hover:scale-[1.06]",
          markClassName,
        )}
      />
      <span className="text-[15px] leading-none tracking-tight text-foreground">
        <span className="font-semibold">Agent</span>
        <span className="font-normal text-foreground/70"> Market</span>
      </span>
    </Link>
  );
}
