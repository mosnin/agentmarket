"use client";

import * as React from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface ProfileTab {
  value: string;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

/**
 * Client wrapper around the Base UI Tabs primitive for the agent profile.
 *
 * The page is a Server Component: each tab's `content` is rendered on the
 * server and passed in as a prop, so the only client-side concern here is the
 * active-tab state. The list scrolls horizontally on small screens without a
 * visible scrollbar.
 */
export function ProfileTabs({
  tabs,
  defaultValue,
}: {
  tabs: ProfileTab[];
  defaultValue?: string;
}) {
  return (
    <Tabs defaultValue={defaultValue ?? tabs[0]?.value} className="gap-6">
      <div className="no-scrollbar -mx-1 overflow-x-auto px-1">
        <TabsList variant="line" className="w-max gap-1 border-b border-border pb-px">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="px-3 py-1.5">
              {tab.icon}
              {tab.label}
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
