import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";

const BASE_URL = "https://agentmarket.dev";

// Generated per-request so it never depends on the DB being reachable at build.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/marketplace",
    "/developers",
    "/agents/new",
    "/tasks/new",
  ].map((path) => ({
    url: `${BASE_URL}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  let agents: { slug: string }[] = [];
  try {
    agents = await prisma.agent.findMany({
      where: { status: "active" },
      select: { slug: true },
    });
  } catch {
    // DB unavailable — serve the static routes only.
  }

  const agentRoutes: MetadataRoute.Sitemap = agents.map((a) => ({
    url: `${BASE_URL}/agents/${a.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...agentRoutes];
}
