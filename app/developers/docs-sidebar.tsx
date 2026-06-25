"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface DocsNavItem {
  id: string;
  label: string;
  /** Optional HTTP method, rendered as a tiny colored tag. */
  method?: string;
  /** Indent nested items (endpoints under a group). */
  nested?: boolean;
}

export interface DocsNavGroup {
  title: string;
  items: DocsNavItem[];
}

const METHOD_COLOR: Record<string, string> = {
  GET: "text-sky-400",
  POST: "text-emerald-400",
  PUT: "text-amber-400",
  DELETE: "text-rose-400",
};

/**
 * Sticky docs navigation with scroll-spy. Renders grouped anchor links and
 * highlights the section currently in the viewport via IntersectionObserver.
 * Clicking a link smooth-scrolls to the anchor (offset for the sticky nav).
 */
export function DocsSidebar({ groups }: { groups: DocsNavGroup[] }) {
  const ids = React.useMemo(
    () => groups.flatMap((g) => g.items.map((i) => i.id)),
    [groups],
  );
  const [active, setActive] = React.useState<string>(ids[0] ?? "");

  React.useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry nearest the top of the viewport that is intersecting.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActive(visible[0].target.id);
        }
      },
      // Trigger when a heading crosses the upper third of the viewport.
      { rootMargin: "-96px 0px -66% 0px", threshold: [0, 1] },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [ids]);

  const handleClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    const el = document.getElementById(id);
    if (!el) return;
    event.preventDefault();
    setActive(id);
    const top = el.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo({ top, behavior: "smooth" });
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <nav aria-label="API reference" className="space-y-6">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="px-2 text-xs font-semibold tracking-wider text-muted-foreground/80 uppercase">
            {group.title}
          </p>
          <ul className="mt-2 space-y-0.5">
            {group.items.map((item) => {
              const isActive = active === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => handleClick(e, item.id)}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "flex items-center gap-2 rounded-md py-1.5 text-sm transition-colors",
                      item.nested ? "pl-5 pr-2" : "px-2",
                      isActive
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    {item.method ? (
                      <span
                        className={cn(
                          "w-9 shrink-0 font-mono text-[10px] font-semibold tracking-tight",
                          METHOD_COLOR[item.method] ?? "text-muted-foreground",
                        )}
                      >
                        {item.method}
                      </span>
                    ) : null}
                    <span className="truncate">{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
