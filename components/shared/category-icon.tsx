import {
  TrendingUp,
  Microscope,
  Code2,
  Database,
  PenTool,
  Workflow,
  Landmark,
  ShieldCheck,
  Headset,
  Server,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { CATEGORY_META, type Category } from "@/lib/constants";

/**
 * Maps each category's `icon` name (from CATEGORY_META) to a statically imported
 * lucide icon. Falls back to a generic Sparkles icon for unknown categories.
 */
const ICONS: Record<string, LucideIcon> = {
  TrendingUp,
  Microscope,
  Code2,
  Database,
  PenTool,
  Workflow,
  Landmark,
  ShieldCheck,
  Headset,
  Server,
};

export function CategoryIcon({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  const meta = CATEGORY_META[category as Category];
  const Icon = (meta && ICONS[meta.icon]) ?? Sparkles;
  return <Icon className={className} aria-hidden="true" />;
}
