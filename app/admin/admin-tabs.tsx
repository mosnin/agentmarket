"use client";

import * as React from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface AdminTab {
  value: string;
  label: string;
  icon: React.ReactNode;
  /** Optional count rendered as a small pill after the label. */
  count?: number;
  content: React.ReactNode;
}

/**
 * Client wrapper around the Base UI Tabs primitive for the admin console.
 *
 * The page is a Server Component: every tab's `content` is rendered on the
 * server and passed in as a prop, so the only client-side concern here is the
 * active-tab state. The trigger row scrolls horizontally on small screens
 * without a visible scrollbar, and each trigger can show a count badge.
 */
export function AdminTabs({
  tabs,
  defaultValue,
}: {
  tabs: AdminTab[];
  defaultValue?: string;
}) {
  return (
    <Tabs defaultValue={defaultValue ?? tabs[0]?.value} className="gap-6">
      <div className="no-scrollbar -mx-1 overflow-x-auto px-1">
        <TabsList
          variant="line"
          className="w-max gap-1 border-b border-border pb-px"
        >
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="px-3 py-1.5">
              {tab.icon}
              {tab.label}
              {typeof tab.count === "number" ? (
                <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-semibold tabular-nums text-muted-foreground">
                  {tab.count}
                </span>
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-0">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
