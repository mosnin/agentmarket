import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { taskUrgencyRank } from "@/lib/tasks";
import type { Category } from "@/lib/constants";

/**
 * Read layer — typed query helpers consumed by server components.
 * All marketplace + dashboard reads go through this module.
 */

// ---------------------------- Includes / types ----------------------------

export const agentCardInclude = {
  capabilities: { include: { capability: true } },
  organization: true,
  owner: true,
  _count: { select: { reviews: true, tasks: true } },
} satisfies Prisma.AgentInclude;

export type AgentCardData = Prisma.AgentGetPayload<{
  include: typeof agentCardInclude;
}>;

export const agentDetailInclude = {
  capabilities: { include: { capability: true } },
  organization: true,
  owner: true,
  reviews: {
    include: { user: true, task: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" },
  },
  tasks: {
    orderBy: { createdAt: "desc" },
    take: 6,
    include: {
      payment: true,
      buyer: true,
      artifacts: { orderBy: { createdAt: "desc" } },
    },
  },
  reputationEvents: { orderBy: { createdAt: "desc" }, take: 12 },
  _count: { select: { reviews: true, tasks: true } },
} satisfies Prisma.AgentInclude;

export type AgentDetailData = Prisma.AgentGetPayload<{
  include: typeof agentDetailInclude;
}>;

export const taskDetailInclude = {
  buyer: true,
  sellerAgent: {
    include: { capabilities: { include: { capability: true } }, owner: true },
  },
  contract: true,
  artifacts: { orderBy: { createdAt: "desc" } },
  payment: true,
  reviews: { include: { user: true } },
  disputes: { include: { openedBy: true }, orderBy: { createdAt: "desc" } },
  reputationEvents: { orderBy: { createdAt: "desc" } },
} satisfies Prisma.TaskInclude;

export type TaskDetailData = Prisma.TaskGetPayload<{
  include: typeof taskDetailInclude;
}>;

export const taskListInclude = {
  buyer: true,
  sellerAgent: { select: { id: true, name: true, slug: true, category: true } },
  payment: true,
} satisfies Prisma.TaskInclude;

export type TaskListItem = Prisma.TaskGetPayload<{
  include: typeof taskListInclude;
}>;

// ---------------------------- Agent reads ----------------------------

export interface AgentFilters {
  search?: string;
  category?: string;
  pricingModel?: string;
  minRating?: number;
  verified?: boolean;
  sort?: "reputation" | "price" | "completion" | "newest" | "rating";
}

/** Hard upper bound on rows returned by a single list query (cost / DoS guard). */
const MAX_LIST_RESULTS = 100;

export async function listAgents(filters: AgentFilters = {}): Promise<AgentCardData[]> {
  // Only `active` listings are public. `draft`/`suspended`/`archived` must not be
  // enumerable in the marketplace — consistent with every other public read.
  const where: Prisma.AgentWhereInput = {
    status: "active",
  };

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { shortDescription: { contains: filters.search, mode: "insensitive" } },
      { longDescription: { contains: filters.search, mode: "insensitive" } },
      {
        capabilities: {
          some: {
            capability: {
              name: { contains: filters.search, mode: "insensitive" },
            },
          },
        },
      },
    ];
  }
  if (filters.category) where.category = filters.category;
  if (filters.pricingModel) where.pricingModel = filters.pricingModel as Prisma.AgentWhereInput["pricingModel"];
  if (filters.verified) where.verified = true;
  if (typeof filters.minRating === "number" && filters.minRating > 0) {
    where.averageRating = { gte: filters.minRating };
  }

  const orderBy: Prisma.AgentOrderByWithRelationInput =
    filters.sort === "price"
      ? { startingPrice: "asc" }
      : filters.sort === "completion"
        ? { completionRate: "desc" }
        : filters.sort === "rating"
          ? { averageRating: "desc" }
          : filters.sort === "newest"
            ? { createdAt: "desc" }
            : { reputationScore: "desc" };

  return prisma.agent.findMany({
    where,
    include: agentCardInclude,
    orderBy,
    take: MAX_LIST_RESULTS,
  });
}

export async function getFeaturedAgents(limit = 6): Promise<AgentCardData[]> {
  return prisma.agent.findMany({
    where: { status: "active" },
    include: agentCardInclude,
    orderBy: { reputationScore: "desc" },
    take: limit,
  });
}

/** Other active agents in the same category, by reputation, excluding one. */
export async function getRelatedAgents(
  category: string,
  excludeId: string,
  limit = 3,
): Promise<AgentCardData[]> {
  return prisma.agent.findMany({
    where: { status: "active", category, id: { not: excludeId } },
    include: agentCardInclude,
    orderBy: { reputationScore: "desc" },
    take: limit,
  });
}

export async function getAgent(idOrSlug: string): Promise<AgentDetailData | null> {
  return prisma.agent.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    include: agentDetailInclude,
  });
}

export async function getAgentsForSelect() {
  return prisma.agent.findMany({
    where: { status: "active" },
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      startingPrice: true,
      currency: true,
      pricingModel: true,
      reputationScore: true,
      verified: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function getCategoriesWithCounts(): Promise<
  { category: string; count: number }[]
> {
  const grouped = await prisma.agent.groupBy({
    by: ["category"],
    where: { status: "active" },
    _count: { _all: true },
  });
  return grouped.map((g) => ({ category: g.category, count: g._count._all }));
}

export async function getCapabilities() {
  return prisma.capability.findMany({ orderBy: { name: "asc" } });
}

// ---------------------------- Task reads ----------------------------

export async function getTask(id: string): Promise<TaskDetailData | null> {
  return prisma.task.findUnique({ where: { id }, include: taskDetailInclude });
}

export async function listTasks(filters: {
  status?: string;
  buyerId?: string;
  sellerAgentId?: string;
  category?: string;
  visibility?: string;
} = {}): Promise<TaskListItem[]> {
  const where: Prisma.TaskWhereInput = {};
  if (filters.status) where.status = filters.status as Prisma.TaskWhereInput["status"];
  if (filters.buyerId) where.buyerId = filters.buyerId;
  if (filters.sellerAgentId) where.sellerAgentId = filters.sellerAgentId;
  if (filters.category) where.category = filters.category;
  if (filters.visibility) {
    where.visibility = filters.visibility as Prisma.TaskWhereInput["visibility"];
  }
  return prisma.task.findMany({
    where,
    include: taskListInclude,
    orderBy: { createdAt: "desc" },
    take: MAX_LIST_RESULTS,
  });
}

// ---------------------------- Dashboard ----------------------------

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function getDashboardData() {
  const user = await getCurrentUser();

  const [buyerTasks, ownedAgents, paymentsReleased, reputationEvents] =
    await Promise.all([
      prisma.task.findMany({
        where: { buyerId: user.id },
        include: taskListInclude,
        orderBy: { createdAt: "desc" },
      }),
      prisma.agent.findMany({
        where: { ownerId: user.id },
        include: { _count: { select: { tasks: true, reviews: true } } },
        orderBy: { reputationScore: "desc" },
      }),
      prisma.payment.findMany({
        where: { status: "released" },
        include: { task: { include: { sellerAgent: true } } },
      }),
      prisma.reputationEvent.findMany({
        where: { agent: { ownerId: user.id } },
        include: { agent: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 40,
      }),
    ]);

  const ownedAgentIds = new Set(ownedAgents.map((a) => a.id));

  const spendPayments = paymentsReleased.filter((p) => p.task.buyerId === user.id);
  const earningPayments = paymentsReleased.filter(
    (p) => p.task.sellerAgentId && ownedAgentIds.has(p.task.sellerAgentId),
  );

  const totalSpend = spendPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalEarnings = earningPayments.reduce((sum, p) => sum + p.amount, 0);
  const activeStatuses = ["pending", "accepted", "running", "submitted", "validating"];
  const activeTasks = buyerTasks
    .filter((t) => activeStatuses.includes(t.status))
    // Float overdue, then due-soon, to the top of the operator's glance list; a
    // stable sort keeps the newest-first order within each urgency band.
    .sort((a, b) => taskUrgencyRank(a) - taskUrgencyRank(b));
  const tasksCompleted = buyerTasks.filter((t) => t.status === "completed").length;
  const averageReputation =
    ownedAgents.length > 0
      ? Math.round(
          ownedAgents.reduce((s, a) => s + a.reputationScore, 0) / ownedAgents.length,
        )
      : 0;

  // Task volume by day (last 14 days, buyer tasks)
  const days: { date: string; tasks: number }[] = [];
  const dayMap = new Map<string, number>();
  for (const t of buyerTasks) dayMap.set(dayKey(t.createdAt), (dayMap.get(dayKey(t.createdAt)) ?? 0) + 1);
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({ date: dayKey(d), tasks: dayMap.get(dayKey(d)) ?? 0 });
  }

  // Revenue by category (owned-agent earnings)
  const revByCat = new Map<string, number>();
  for (const p of earningPayments) {
    revByCat.set(p.task.category, (revByCat.get(p.task.category) ?? 0) + p.amount);
  }
  const revenueByCategory = [...revByCat.entries()]
    .map(([category, revenue]) => ({ category, revenue }))
    .sort((a, b) => b.revenue - a.revenue);

  // Reputation trend (cumulative over last events)
  const evByDay = new Map<string, number>();
  for (const e of reputationEvents) evByDay.set(dayKey(e.createdAt), (evByDay.get(dayKey(e.createdAt)) ?? 0) + e.scoreDelta);
  const trendDays: { date: string; score: number }[] = [];
  let running = averageReputation - reputationEvents.reduce((s, e) => s + e.scoreDelta, 0);
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    running += evByDay.get(dayKey(d)) ?? 0;
    trendDays.push({ date: dayKey(d), score: Math.round(running) });
  }

  const recentPayments = [...spendPayments, ...earningPayments]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 6);

  const marketplaceActivity = await prisma.task.findMany({
    include: taskListInclude,
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return {
    user,
    cards: {
      totalSpend,
      totalEarnings,
      activeTasks: activeTasks.length,
      agentsOwned: ownedAgents.length,
      averageReputation,
      tasksCompleted,
    },
    charts: { taskVolume: days, revenueByCategory, reputationTrend: trendDays },
    activeTasksList: activeTasks.slice(0, 6),
    recentPayments,
    ownedAgents,
    marketplaceActivity,
    reputationChanges: reputationEvents.slice(0, 8),
  };
}

// ---------------------------- Seller ----------------------------

export async function getSellerData() {
  const user = await getCurrentUser();
  const agents = await prisma.agent.findMany({
    where: { ownerId: user.id },
    include: {
      capabilities: { include: { capability: true } },
      _count: { select: { tasks: true, reviews: true } },
    },
    orderBy: { reputationScore: "desc" },
  });
  const agentIds = agents.map((a) => a.id);

  const [inboundTasks, reviews, releasedPayments] = await Promise.all([
    prisma.task.findMany({
      where: { sellerAgentId: { in: agentIds } },
      include: taskListInclude,
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.findMany({
      where: { agentId: { in: agentIds } },
      include: { user: true, agent: { select: { name: true } }, task: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.payment.findMany({
      where: { status: "released", task: { sellerAgentId: { in: agentIds } } },
    }),
  ]);

  const totalEarnings = releasedPayments.reduce((s, p) => s + p.amount, 0);
  // A task still needs the seller's attention until it settles (completed,
  // cancelled and disputed leave the action queue).
  const isOpen = (t: { status: string }) =>
    ["pending", "accepted", "running", "submitted", "validating"].includes(
      t.status,
    );
  const openInbound = inboundTasks.filter(isOpen);

  // Lead the inbound table with the work that needs attention: first by time
  // urgency (overdue, then due-soon), then float still-open tasks above settled
  // ones, keeping newest-first within each band (the fetch is createdAt desc).
  const sortedInbound = [...inboundTasks].sort((a, b) => {
    const byUrgency = taskUrgencyRank(a) - taskUrgencyRank(b);
    if (byUrgency !== 0) return byUrgency;
    return Number(isOpen(b)) - Number(isOpen(a));
  });

  return {
    user,
    agents,
    inboundTasks: sortedInbound,
    openInbound,
    reviews,
    totalEarnings,
    completedCount: inboundTasks.filter((t) => t.status === "completed").length,
  };
}

// ---------------------------- Admin ----------------------------

export async function getAdminData() {
  const [agents, disputes, payments, reputationEvents, suspiciousTasks] =
    await Promise.all([
      prisma.agent.findMany({
        include: { owner: true, organization: true, _count: { select: { tasks: true, reviews: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.dispute.findMany({
        include: { task: { include: { sellerAgent: true, buyer: true } }, openedBy: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.payment.findMany({
        include: { task: { select: { id: true, title: true, category: true } } },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.reputationEvent.findMany({
        include: { agent: { select: { name: true, slug: true } } },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.task.findMany({
        where: {
          OR: [
            { status: "disputed" },
            { artifacts: { some: { validationStatus: "failed" } } },
          ],
        },
        include: taskListInclude,
        orderBy: { createdAt: "desc" },
      }),
    ]);

  return {
    agents,
    disputes,
    payments,
    reputationEvents,
    suspiciousTasks,
    stats: {
      totalAgents: agents.length,
      verifiedAgents: agents.filter((a) => a.verified).length,
      openDisputes: disputes.filter((d) => d.status === "open").length,
      totalPayments: payments.length,
    },
  };
}

export const KNOWN_CATEGORIES: Category[] = [
  "Growth",
  "Research",
  "Coding",
  "Data",
  "Design",
  "Operations",
  "Finance",
  "Security",
  "Customer Support",
  "Infrastructure",
];
