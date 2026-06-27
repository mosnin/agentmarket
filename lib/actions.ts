"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { slugify, mockHash } from "@/lib/utils";
import {
  createAgentSchema,
  createTaskSchema,
  submitArtifactSchema,
  reviewSchema,
  disputeSchema,
  parseJsonObject,
} from "@/lib/schemas";
import {
  recordReputationEvent,
  recalculateAgentStats,
  REPUTATION_DELTAS,
} from "@/lib/reputation";
import {
  ensureEscrowPayment,
  releaseTaskPayment,
  refundTaskPayment,
} from "@/lib/payments";
import { runMockValidation } from "@/lib/mockValidation";

type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

function revalidateAll(...paths: string[]) {
  for (const p of paths) revalidatePath(p);
}

// ------------------------------ Agents ------------------------------

export async function createAgent(
  input: unknown,
): Promise<ActionResult<{ agentId: string; slug: string }>> {
  const parsed = createAgentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;
  const user = await getCurrentUser();

  let slug = slugify(data.name) || `agent-${mockHash("", data.name).slice(0, 6)}`;
  if (await prisma.agent.findUnique({ where: { slug } })) {
    slug = `${slug}-${mockHash("", data.name + Date.now()).slice(0, 5)}`;
  }

  const agent = await prisma.agent.create({
    data: {
      name: data.name,
      slug,
      shortDescription: data.shortDescription,
      longDescription: data.longDescription,
      category: data.category,
      pricingModel: data.pricingModel,
      startingPrice: data.startingPrice,
      currency: data.currency ?? "USD",
      endpointUrl: data.endpointUrl || null,
      mcpServerUrl: data.mcpServerUrl || null,
      inputSchema: (parseJsonObject(data.inputSchema) ?? undefined) as Prisma.InputJsonValue | undefined,
      outputSchema: (parseJsonObject(data.outputSchema) ?? undefined) as Prisma.InputJsonValue | undefined,
      verified: data.verified ?? false,
      status: "active",
      reputationScore: 50,
      ownerId: user.id,
      organizationId: data.organizationId ?? user.organizationId ?? null,
    },
  });

  for (const name of data.capabilities) {
    const capSlug = slugify(name);
    if (!capSlug) continue;
    const capability = await prisma.capability.upsert({
      where: { slug: capSlug },
      update: {},
      create: { name, slug: capSlug, category: data.category },
    });
    await prisma.agentCapability.upsert({
      where: {
        agentId_capabilityId: { agentId: agent.id, capabilityId: capability.id },
      },
      update: {},
      create: { agentId: agent.id, capabilityId: capability.id },
    });
  }

  revalidateAll("/marketplace", "/seller", "/admin", "/dashboard");
  return { ok: true, agentId: agent.id, slug: agent.slug };
}

export async function updateAgent(
  agentId: string,
  input: unknown,
): Promise<ActionResult<{ agentId: string }>> {
  const parsed = createAgentSchema.partial().safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // Only the owner may edit a listing.
  const user = await getCurrentUser();
  const existing = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { ownerId: true },
  });
  if (!existing) {
    return { ok: false, error: "Agent not found." };
  }
  if (existing.ownerId !== user.id) {
    return { ok: false, error: "You can only edit agents you own." };
  }

  const data = parsed.data;
  await prisma.agent.update({
    where: { id: agentId },
    data: {
      name: data.name,
      shortDescription: data.shortDescription,
      longDescription: data.longDescription,
      category: data.category,
      pricingModel: data.pricingModel,
      startingPrice: data.startingPrice,
      endpointUrl: data.endpointUrl || null,
      mcpServerUrl: data.mcpServerUrl || null,
      inputSchema: (parseJsonObject(data.inputSchema) ?? undefined) as Prisma.InputJsonValue | undefined,
      outputSchema: (parseJsonObject(data.outputSchema) ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
  revalidateAll(`/agents/${agentId}`, "/seller", "/marketplace");
  return { ok: true, agentId };
}

export async function verifyAgent(
  agentId: string,
): Promise<ActionResult<{ agentId: string }>> {
  const agent = await prisma.agent.update({
    where: { id: agentId },
    data: { verified: true },
  });
  await recordReputationEvent({
    agentId,
    type: "agent_verified",
    scoreDelta: REPUTATION_DELTAS.agentVerified,
    reason: "Agent verified by an administrator.",
  });
  revalidateAll("/admin", "/marketplace", `/agents/${agent.id}`, `/agents/${agent.slug}`);
  return { ok: true, agentId };
}

export async function setAgentStatus(
  agentId: string,
  status: "active" | "suspended" | "archived" | "draft",
): Promise<ActionResult> {
  await prisma.agent.update({ where: { id: agentId }, data: { status } });
  revalidateAll("/admin", "/marketplace", "/seller");
  return { ok: true };
}

// ------------------------------ Tasks ------------------------------

export async function createTask(
  input: unknown,
): Promise<ActionResult<{ taskId: string }>> {
  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;
  const user = await getCurrentUser();

  const agent = await prisma.agent.findUnique({
    where: { id: data.sellerAgentId },
    select: { id: true, currency: true },
  });
  if (!agent) return { ok: false, error: "Target agent not found" };

  const instructions = data.inputInstructions?.trim() ?? "";
  const dataUrl = data.inputDataUrl?.trim() ?? "";
  const inputPayload: Record<string, string> = {};
  if (instructions) inputPayload.instructions = instructions;
  if (dataUrl) inputPayload.dataUrl = dataUrl;
  const outputSchema = { format: data.outputFormat };
  const validationRules = data.validationRules
    ? { rules: data.validationRules.split("\n").map((r) => r.trim()).filter(Boolean) }
    : { rules: [] };

  const task = await prisma.task.create({
    data: {
      title: data.title,
      objective: data.objective,
      category: data.category,
      status: "pending",
      visibility: data.visibility,
      budget: data.budget,
      currency: agent.currency ?? "USD",
      deadline: data.deadline ? new Date(data.deadline) : null,
      buyerId: user.id,
      sellerAgentId: agent.id,
      contract: {
        create: {
          inputPayload,
          outputSchema,
          validationRules,
          paymentMode: data.paymentMode,
          successCriteria: data.validationRules || "Deliver an artifact matching the output format.",
          contractHash: mockHash("0x", `${data.title}:${data.objective}:${data.budget}`),
        },
      },
    },
  });

  await ensureEscrowPayment({
    taskId: task.id,
    amount: data.budget,
    currency: agent.currency ?? "USD",
    mode: data.paymentMode,
  });

  revalidateAll("/dashboard", "/seller", `/tasks/${task.id}`);
  return { ok: true, taskId: task.id };
}

export async function acceptTask(taskId: string): Promise<ActionResult> {
  await prisma.task.update({ where: { id: taskId }, data: { status: "accepted" } });
  revalidateAll(`/tasks/${taskId}`, "/dashboard", "/seller");
  return { ok: true };
}

export async function startTask(taskId: string): Promise<ActionResult> {
  await prisma.task.update({ where: { id: taskId }, data: { status: "running" } });
  revalidateAll(`/tasks/${taskId}`, "/dashboard", "/seller");
  return { ok: true };
}

export async function submitArtifact(
  taskId: string,
  input: unknown,
): Promise<ActionResult<{ artifactId: string }>> {
  const parsed = submitArtifactSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;
  const artifact = await prisma.artifact.create({
    data: {
      taskId,
      title: data.title,
      type: data.type,
      url: data.url || null,
      content: data.content || null,
      validationStatus: "pending",
    },
  });
  await prisma.task.update({ where: { id: taskId }, data: { status: "submitted" } });
  revalidateAll(`/tasks/${taskId}`, "/dashboard", "/seller");
  return { ok: true, artifactId: artifact.id };
}

export async function runValidation(
  taskId: string,
): Promise<ActionResult<{ score: number; passed: boolean }>> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      contract: true,
      artifacts: { orderBy: { createdAt: "desc" }, take: 1 },
      sellerAgent: { select: { id: true, schemaComplianceScore: true } },
    },
  });
  if (!task) return { ok: false, error: "Task not found" };
  const artifact = task.artifacts[0];
  if (!artifact) return { ok: false, error: "No artifact to validate" };

  await prisma.task.update({ where: { id: taskId }, data: { status: "validating" } });

  const result = runMockValidation({
    artifactId: artifact.id,
    taskId: task.id,
    hasArtifact: true,
    hasContent: Boolean(artifact.content || artifact.url),
    hasOutputSchema: Boolean(task.contract?.outputSchema),
  });

  await prisma.artifact.update({
    where: { id: artifact.id },
    data: {
      validationStatus: result.status,
      validationScore: result.score,
    },
  });

  if (task.sellerAgent) {
    await recordReputationEvent({
      agentId: task.sellerAgent.id,
      taskId: task.id,
      type: result.passed ? "validation_passed" : "validation_failed",
      scoreDelta: result.passed
        ? REPUTATION_DELTAS.validationPassed
        : REPUTATION_DELTAS.validationFailed,
      reason: result.summary,
    });
    const blended = Math.round(
      ((task.sellerAgent.schemaComplianceScore || result.score) + result.score) / 2,
    );
    await prisma.agent.update({
      where: { id: task.sellerAgent.id },
      data: { schemaComplianceScore: blended },
    });
  }

  revalidateAll(`/tasks/${taskId}`, "/dashboard", "/seller");
  return { ok: true, score: result.score, passed: result.passed };
}

export async function completeTask(taskId: string): Promise<ActionResult> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { sellerAgent: { select: { id: true } } },
  });
  if (!task) return { ok: false, error: "Task not found" };

  await prisma.task.update({ where: { id: taskId }, data: { status: "completed" } });
  await releaseTaskPayment(taskId);

  if (task.sellerAgent) {
    await recordReputationEvent({
      agentId: task.sellerAgent.id,
      taskId,
      type: "task_completed",
      scoreDelta: REPUTATION_DELTAS.taskCompleted,
      reason: "Task completed and payment released.",
    });
    await recalculateAgentStats(task.sellerAgent.id, { kind: "task_completed" });
  }

  revalidateAll(`/tasks/${taskId}`, "/dashboard", "/seller", "/marketplace");
  return { ok: true };
}

export async function cancelTask(taskId: string): Promise<ActionResult> {
  await prisma.task.update({ where: { id: taskId }, data: { status: "cancelled" } });
  await refundTaskPayment(taskId);
  revalidateAll(`/tasks/${taskId}`, "/dashboard", "/seller");
  return { ok: true };
}

export async function openDispute(
  taskId: string,
  input: unknown,
): Promise<ActionResult<{ disputeId: string }>> {
  const parsed = disputeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const user = await getCurrentUser();
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { sellerAgent: { select: { id: true } } },
  });
  if (!task) return { ok: false, error: "Task not found" };

  const dispute = await prisma.dispute.create({
    data: {
      taskId,
      openedById: user.id,
      reason: parsed.data.reason,
      status: "open",
    },
  });
  await prisma.task.update({ where: { id: taskId }, data: { status: "disputed" } });

  if (task.sellerAgent) {
    await recordReputationEvent({
      agentId: task.sellerAgent.id,
      taskId,
      type: "dispute_opened",
      scoreDelta: REPUTATION_DELTAS.disputeOpened,
      reason: "A dispute was opened on a deliverable.",
    });
    await recalculateAgentStats(task.sellerAgent.id, { kind: "dispute_opened" });
  }

  revalidateAll(`/tasks/${taskId}`, "/admin", "/dashboard", "/seller");
  return { ok: true, disputeId: dispute.id };
}

export async function resolveDispute(
  disputeId: string,
  resolution: string,
  outcome: "resolved" | "rejected" = "resolved",
): Promise<ActionResult> {
  const dispute = await prisma.dispute.update({
    where: { id: disputeId },
    data: { status: outcome, resolution },
    include: { task: { include: { sellerAgent: { select: { id: true } } } } },
  });
  if (dispute.task.sellerAgent && outcome === "resolved") {
    await recordReputationEvent({
      agentId: dispute.task.sellerAgent.id,
      taskId: dispute.taskId,
      type: "dispute_resolved",
      scoreDelta: REPUTATION_DELTAS.disputeResolved,
      reason: "Dispute resolved.",
    });
  }
  revalidateAll("/admin", `/tasks/${dispute.taskId}`);
  return { ok: true };
}

// ------------------------------ Reviews ------------------------------

export async function createReview(
  taskId: string,
  input: unknown,
): Promise<ActionResult<{ reviewId: string }>> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const user = await getCurrentUser();
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { sellerAgentId: true },
  });
  if (!task?.sellerAgentId) {
    return { ok: false, error: "Task has no seller agent to review" };
  }

  const review = await prisma.review.upsert({
    where: { taskId_userId: { taskId, userId: user.id } },
    update: { rating: parsed.data.rating, comment: parsed.data.comment || null },
    create: {
      taskId,
      agentId: task.sellerAgentId,
      userId: user.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment || null,
    },
  });

  await recordReputationEvent({
    agentId: task.sellerAgentId,
    taskId,
    type: "review_received",
    scoreDelta: REPUTATION_DELTAS.reviewBase + parsed.data.rating,
    reason: `Received a ${parsed.data.rating}-star review.`,
  });
  await recalculateAgentStats(task.sellerAgentId, {
    kind: "review_added",
    rating: parsed.data.rating,
  });

  revalidateAll(`/tasks/${taskId}`, "/marketplace", "/seller");
  return { ok: true, reviewId: review.id };
}
