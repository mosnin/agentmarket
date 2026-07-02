"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SearchCommand } from "@/components/layout/search-command";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { BrandLockup } from "@/components/brand/brand-lockup";

interface NavLink {
  label: string;
  href: string;
  /** Anchor links never get "active" styling. */
  anchor?: boolean;
}

const NAV_LINKS: NavLink[] = [
  { label: "Marketplace", href: "/marketplace" },
  { label: "Developers", href: "/developers" },
  { label: "How it works", href: "/#how-it-works", anchor: true },
];

export function LandingNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const isActive = (link: NavLink) =>
    !link.anchor && (pathname === link.href || pathname.startsWith(`${link.href}/`));

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:border focus:border-border focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-lg focus:ring-3 focus:ring-ring/40 focus:outline-none"
      >
        Skip to main content
      </a>
      <header className="glass sticky top-0 z-50 w-full border-b border-border">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left: wordmark + desktop nav */}
        <div className="flex items-center gap-8">
          <BrandLockup />
          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => {
              const active = isActive(link);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: search, theme, CTAs (desktop) */}
        <div className="flex items-center gap-2">
          <SearchCommand />
          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            <span className="mx-1 h-5 w-px bg-border" aria-hidden />
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ variant: "ghost", size: "default" }))}
            >
              Dashboard
            </Link>
            <Link
              href="/agents/new"
              className={cn(buttonVariants({ variant: "default", size: "default" }))}
            >
              List your agent
            </Link>
          </div>

          {/* Mobile: theme toggle + hamburger */}
          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle />
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon" aria-label="Open menu" />
                }
              >
                <Menu className="size-5" />
              </SheetTrigger>
              <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-sm">
                <SheetHeader className="border-b border-border p-4">
                  <SheetTitle className="text-left">
                    <BrandLockup onClick={() => setMobileOpen(false)} />
                  </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col gap-1 p-4">
                  {NAV_LINKS.map((link) => {
                    const active = isActive(link);
                    return (
                      <SheetClose
                        key={link.href}
                        render={
                          <Link
                            href={link.href}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                              active
                                ? "bg-muted text-foreground"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                          />
                        }
                      >
                        {link.label}
                      </SheetClose>
                    );
                  })}
                </div>

                <div className="mt-auto flex flex-col gap-2 border-t border-border p-4">
                  <SheetClose
                    render={
                      <Link
                        href="/dashboard"
                        className={cn(
                          buttonVariants({ variant: "outline", size: "lg" }),
                          "w-full",
                        )}
                      />
                    }
                  >
                    Open dashboard
                  </SheetClose>
                  <SheetClose
                    render={
                      <Link
                        href="/agents/new"
                        className={cn(
                          buttonVariants({ variant: "default", size: "lg" }),
                          "w-full",
                        )}
                      />
                    }
                  >
                    List your agent
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
    </>
  );
}
