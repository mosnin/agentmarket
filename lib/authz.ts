/**
 * Authorization substrate.
 *
 * A single chokepoint for "who may do what". The async guards resolve the current
 * principal (via `getCurrentUser`) and check ownership/role against the database;
 * the pure predicates below encode the policy and are unit-tested without a DB.
 *
 * Today the session is the mock operator (see `lib/auth.ts`). When a real auth
 * provider is wired, only `getCurrentUser` changes — every privileged action and
 * route already funnels through these guards, so the access-control model holds.
 */

import { prisma } from "@/lib/prisma";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";

/** Mirrors the actions-layer result so a failed guard returns directly as an ActionResult. */
export type AuthzResult =
  | { ok: true; user: CurrentUser }
  | { ok: false; error: string };

// ----------------------------- Pure policy predicates -----------------------------
// DB-free and side-effect-free so they can be exhaustively unit-tested.

type Principal = { id: string; role: string };

/** Admins may act on any resource (moderation). */
export function isAdmin(user: { role: string }): boolean {
  return user.role === "admin";
}

/** The agent's owner, or an admin, may manage a listing. */
export function canManageAgent(
  user: Principal,
  agent: { ownerId: string },
): boolean {
  return agent.ownerId === user.id || isAdmin(user);
}

/** The task's buyer, or an admin, may act on the buyer side (complete/cancel/review). */
export function canActAsBuyer(
  user: Principal,
  task: { buyerId: string },
): boolean {
  return task.buyerId === user.id || isAdmin(user);
}

/** The owner of the assigned seller agent, or an admin, may act on the seller side. */
export function canActAsSeller(
  user: Principal,
  task: { sellerAgent: { ownerId: string } | null },
): boolean {
  return task.sellerAgent?.ownerId === user.id || isAdmin(user);
}

/** Either party (or an admin) may act — e.g. opening a dispute. */
export function isTaskParticipant(
  user: Principal,
  task: { buyerId: string; sellerAgent: { ownerId: string } | null },
): boolean {
  return canActAsBuyer(user, task) || canActAsSeller(user, task);
}

// ----------------------------- Async guards -----------------------------

export async function requireUser(): Promise<AuthzResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "You must be signed in." };
  return { ok: true, user };
}

export async function requireAdmin(): Promise<AuthzResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "You must be signed in." };
  if (!isAdmin(user)) return { ok: false, error: "Administrator access required." };
  return { ok: true, user };
}

export async function assertAgentOwner(agentId: string): Promise<AuthzResult> {
  const user = await getCurrentUser();
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { ownerId: true },
  });
  if (!agent) return { ok: false, error: "Agent not found." };
  if (!canManageAgent(user, agent)) {
    return { ok: false, error: "You can only manage agents you own." };
  }
  return { ok: true, user };
}

/** Load just the parties needed to authorize a task action. */
async function loadTaskParties(taskId: string) {
  return prisma.task.findUnique({
    where: { id: taskId },
    select: { buyerId: true, sellerAgent: { select: { ownerId: true } } },
  });
}

export async function assertTaskBuyer(taskId: string): Promise<AuthzResult> {
  const user = await getCurrentUser();
  const task = await loadTaskParties(taskId);
  if (!task) return { ok: false, error: "Task not found." };
  if (!canActAsBuyer(user, task)) {
    return { ok: false, error: "Only the task's buyer can perform this action." };
  }
  return { ok: true, user };
}

export async function assertTaskSellerOwner(taskId: string): Promise<AuthzResult> {
  const user = await getCurrentUser();
  const task = await loadTaskParties(taskId);
  if (!task) return { ok: false, error: "Task not found." };
  if (!canActAsSeller(user, task)) {
    return {
      ok: false,
      error: "Only the assigned seller agent's owner can perform this action.",
    };
  }
  return { ok: true, user };
}

export async function assertTaskParticipant(taskId: string): Promise<AuthzResult> {
  const user = await getCurrentUser();
  const task = await loadTaskParties(taskId);
  if (!task) return { ok: false, error: "Task not found." };
  if (!isTaskParticipant(user, task)) {
    return { ok: false, error: "Only a participant on this task can perform this action." };
  }
  return { ok: true, user };
}
