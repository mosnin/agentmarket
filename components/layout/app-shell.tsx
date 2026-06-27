"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Code2,
  FilePlus2,
  Hexagon,
  LayoutDashboard,
  Menu,
  Package,
  Plus,
  ShieldCheck,
  Store,
} from "lucide-react";

import { cn, initials } from "@/lib/utils";
import { DEFAULT_ORG, DEFAULT_USER } from "@/lib/constants";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SearchCommand } from "@/components/layout/search-command";
import { ThemeToggle } from "@/components/layout/theme-toggle";

type IconType = React.ComponentType<{ className?: string }>;

interface NavItem {
  label: string;
  href: string;
  icon: IconType;
  /** Match the exact path only (used for `/dashboard` so it isn't always active). */
  exact?: boolean;
}

const PRIMARY_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Marketplace", href: "/marketplace", icon: Store },
  { label: "Seller Studio", href: "/seller", icon: Package },
  { label: "Developers", href: "/developers", icon: Code2 },
  { label: "Admin", href: "/admin", icon: ShieldCheck },
];

const CREATE_NAV: NavItem[] = [
  { label: "New agent", href: "/agents/new", icon: Plus },
  { label: "New task", href: "/tasks/new", icon: FilePlus2 },
];

function useIsActive() {
  const pathname = usePathname();
  return React.useCallback(
    (item: NavItem) =>
      item.exact
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(`${item.href}/`),
    [pathname],
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const isActive = useIsActive();

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    const active = isActive(item);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        )}
      >
        <Icon
          className={cn(
            "size-4 shrink-0 transition-colors",
            active ? "text-brand" : "text-muted-foreground group-hover:text-foreground",
          )}
        />
        {item.label}
      </Link>
    );
  };

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      <div className="flex flex-col gap-1">{PRIMARY_NAV.map(renderItem)}</div>

      <Separator className="my-3" />

      <p className="px-3 pb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        Create
      </p>
      <div className="flex flex-col gap-1">{CREATE_NAV.map(renderItem)}</div>
    </nav>
  );
}

function Wordmark({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className="group flex items-center gap-2.5"
      aria-label="Agent Market home"
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-brand-foreground shadow-glow transition-transform group-hover:scale-105">
        <Hexagon className="size-4.5" />
      </span>
      <span className="font-heading text-[15px] font-semibold tracking-tight text-foreground">
        Agent Market
      </span>
    </Link>
  );
}

function UserChip() {
  return (
    <div className="flex items-center gap-3 border-t border-border p-3">
      <Avatar size="default">
        <AvatarFallback className="bg-brand/15 text-brand">
          {initials(DEFAULT_USER.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {DEFAULT_USER.name}
        </p>
        <p className="truncate text-xs text-muted-foreground">{DEFAULT_ORG.name}</p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Skip link — first focusable element, for keyboard / screen-reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:border focus:border-border focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-lg focus:ring-3 focus:ring-ring/40 focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Fixed desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-sidebar lg:flex">
        <div className="flex h-16 shrink-0 items-center border-b border-border px-5">
          <Wordmark />
        </div>
        <ScrollArea className="flex-1">
          <NavLinks />
        </ScrollArea>
        <UserChip />
      </aside>

      {/* Content column (offset by sidebar on desktop) */}
      <div className="flex min-h-screen flex-col lg:pl-64">
        {/* Top bar */}
        <header className="glass sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border px-4 sm:px-6">
          {/* Mobile menu trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open navigation"
                  className="lg:hidden"
                />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 gap-0 p-0">
              <SheetHeader className="border-b border-border p-4">
                <SheetTitle className="text-left">
                  <Wordmark onClick={() => setMobileOpen(false)} />
                </SheetTitle>
              </SheetHeader>
              <ScrollArea className="flex-1">
                <NavLinks onNavigate={() => setMobileOpen(false)} />
              </ScrollArea>
              <UserChip />
            </SheetContent>
          </Sheet>

          <div className="flex flex-1 items-center justify-end gap-2">
            <div className="mr-auto lg:mr-0">
              <SearchCommand />
            </div>
            <ThemeToggle />
            <Link
              href="/agents/new"
              className={cn(
                buttonVariants({ variant: "default", size: "default" }),
                "hidden sm:inline-flex",
              )}
            >
              <Plus className="size-4" />
              List your agent
            </Link>
          </div>
        </header>

        {/* Scrollable main content */}
        <main id="main-content" className="flex-1">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
