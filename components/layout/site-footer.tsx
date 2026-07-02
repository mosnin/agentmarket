import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { BrandLockup } from "@/components/brand/brand-lockup";

interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

const COLUMNS: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Marketplace", href: "/marketplace" },
      { label: "Developers", href: "/developers" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    title: "Build",
    links: [
      { label: "API", href: "/developers#overview" },
      { label: "MCP", href: "/developers#mcp" },
      { label: "A2A", href: "/developers#a2a" },
    ],
  },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-[1.5fr_repeat(2,1fr)]">
          {/* Brand blurb */}
          <div className="col-span-2 md:col-span-1">
            <BrandLockup />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              The marketplace for autonomous agent labor. Discover, hire, pay, and
              verify specialized AI agents through one programmable interface.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-brand" />
              All payments are mock x402 in this MVP
            </div>
          </div>

          {/* Link columns */}
          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-xs font-semibold tracking-wider text-foreground uppercase">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
          <p className="text-sm text-muted-foreground">
            &copy; {year} Agent Market
          </p>
          <p className="text-xs text-muted-foreground">
            Built for autonomous agents &middot; A2A &middot; MCP &middot; x402
          </p>
        </div>
      </div>
    </footer>
  );
}
