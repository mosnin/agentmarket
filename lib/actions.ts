"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  requireUser,
  requireAdmin,
  assertAgentOwner,
  assertTaskBuyer,
  assertTaskSellerOwner,
  assertTaskParticipant,
} from "@/lib/authz";
import { TASK_TRANSITIONS, canTransition, transitionError } from "@/lib/taskState";
import { isTaskReviewable } from "@/lib/tasks";
import { VALIDATION_PASS_THRESHOLD } from "@/lib/constants";
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
  const gate = await requireUser();
  if (!gate.ok) return gate;
  const user = gate.user;

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
      // Never trust client input for verification — admins grant it via verifyAgent.
      verified: false,
      status: "active",
      reputationScore: 50,
      ownerId: user.id,
      organizationId: data.organizationId ?? user.organizationId ?? null,
    },
  });

  // De-dupe by slug (e.g. "Research" vs "research" collapse) so parallel upserts
  // never race on the same unique row, then fan them out instead of awaiting each
  // capability serially.
  const uniqueCapabilities = Array.from(
    new Map(
      data.capabilities
        .map((name) => [slugify(name), name] as const)
        .filter(([capSlug]) => capSlug),
    ),
  );
  await Promise.all(
    uniqueCapabilities.map(async ([capSlug, name]) => {
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
    }),
  );

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

  // Only the owner (or an admin) may edit a listing.
  const gate = await assertAgentOwner(agentId);
  if (!gate.ok) return gate;

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
  const gate = await requireAdmin();
  if (!gate.ok) return gate;
  const existing = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { id: true, slug: true },
  });
  if (!existing) return { ok: false, error: "Agent not found." };
  await prisma.agent.update({
    where: { id: agentId },
    data: { verified: true },
  });
  await recordReputationEvent({
    agentId,
    type: "agent_verified",
    scoreDelta: REPUTATION_DELTAS.agentVerified,
    reason: "Agent verified by an administrator.",
  });
  revalidateAll("/admin", "/marketplace", `/agents/${existing.id}`, `/agents/${existing.slug}`);
  return { ok: true, agentId };
}

export async function setAgentStatus(
  agentId: string,
  status: "active" | "suspended" | "archived" | "draft",
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate;
  const { count } = await prisma.agent.updateMany({
    where: { id: agentId },
    data: { status },
  });
  if (count === 0) return { ok: false, error: "Agent not found." };
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
  const gate = await requireUser();
  if (!gate.ok) return gate;
  const user = gate.user;

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
  const gate = await assertTaskSellerOwner(taskId);
  if (!gate.ok) return gate;
  const { count } = await prisma.task.updateMany({
    where: { id: taskId, status: { in: [...TASK_TRANSITIONS.accept.from] } },
    data: { status: "accepted" },
  });
  if (count === 0) return { ok: false, error: transitionError("accept") };
  revalidateAll(`/tasks/${taskId}`, "/dashboard", "/seller");
  return { ok: true };
}

export async function startTask(taskId: string): Promise<ActionResult> {
  const gate = await assertTaskSellerOwner(taskId);
  if (!gate.ok) return gate;
  const { count } = await prisma.task.updateMany({
    where: { id: taskId, status: { in: [...TASK_TRANSITIONS.start.from] } },
    data: { status: "running" },
  });
  if (count === 0) return { ok: false, error: transitionError("start") };
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
  const gate = await assertTaskSellerOwner(taskId);
  if (!gate.ok) return gate;
  // Atomically guard the transition before persisting the artifact, so a
  // deliverable can only be attached while the task is in a submittable state.
  const { count } = await prisma.task.updateMany({
    where: { id: taskId, status: { in: [...TASK_TRANSITIONS.submit.from] } },
    data: { status: "submitted" },
  });
  if (count === 0) return { ok: false, error: transitionError("submit") };
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
  revalidateAll(`/tasks/${taskId}`, "/dashboard", "/seller");
  return { ok: true, artifactId: artifact.id };
}

export async function runValidation(
  taskId: string,
): Promise<ActionResult<{ score: number; passed: boolean }>> {
  const gate = await assertTaskSellerOwner(taskId);
  if (!gate.ok) return gate;
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      contract: true,
      artifacts: { orderBy: { createdAt: "desc" }, take: 1 },
      sellerAgent: { select: { id: true, schemaComplianceScore: true } },
    },
  });
  if (!task) return { ok: false, error: "Task not found" };
  if (!canTransition("validate", task.status)) {
    return { ok: false, error: transitionError("validate") };
  }
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
  const gate = await assertTaskBuyer(taskId);
  if (!gate.ok) return gate;
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      sellerAgent: { select: { id: true } },
      artifacts: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!task) return { ok: false, error: "Task not found" };

  // Escrow is released only after the latest deliverable PASSED validation —
  // enforced here (not just in the API route) so the server-action path can't
  // settle a failed artifact.
  const latest = task.artifacts[0];
  const passedValidation =
    latest?.validationStatus === "passed" &&
    (latest.validationScore ?? 0) >= VALIDATION_PASS_THRESHOLD;
  if (!passedValidation) {
    return {
      ok: false,
      error: `Payment can only be released after the latest artifact passes validation (score ≥ ${VALIDATION_PASS_THRESHOLD}).`,
    };
  }

  // Atomic transition: payment is released only if THIS call performed the
  // validating -> completed flip, so a double-submit can't double-release.
  const { count } = await prisma.task.updateMany({
    where: { id: taskId, status: { in: [...TASK_TRANSITIONS.complete.from] } },
    data: { status: "completed" },
  });
  if (count === 0) return { ok: false, error: transitionError("complete") };
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
  const gate = await assertTaskBuyer(taskId);
  if (!gate.ok) return gate;
  const { count } = await prisma.task.updateMany({
    where: { id: taskId, status: { in: [...TASK_TRANSITIONS.cancel.from] } },
    data: { status: "cancelled" },
  });
  if (count === 0) return { ok: false, error: transitionError("cancel") };
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
  const gate = await assertTaskParticipant(taskId);
  if (!gate.ok) return gate;
  const user = gate.user;
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { sellerAgent: { select: { id: true } } },
  });
  if (!task) return { ok: false, error: "Task not found" };

  const { count } = await prisma.task.updateMany({
    where: { id: taskId, status: { in: [...TASK_TRANSITIONS.dispute.from] } },
    data: { status: "disputed" },
  });
  if (count === 0) return { ok: false, error: transitionError("dispute") };

  const dispute = await prisma.dispute.create({
    data: {
      taskId,
      openedById: user.id,
      reason: parsed.data.reason,
      status: "open",
    },
  });

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
  const gate = await requireAdmin();
  if (!gate.ok) return gate;
  const found = await prisma.dispute.findUnique({
    where: { id: disputeId },
    select: { id: true },
  });
  if (!found) return { ok: false, error: "Dispute not found." };
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
  const gate = await assertTaskBuyer(taskId);
  if (!gate.ok) return gate;
  const user = gate.user;
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { sellerAgentId: true, status: true },
  });
  if (!task?.sellerAgentId) {
    return { ok: false, error: "Task has no seller agent to review" };
  }
  // A review must reflect real delivered work: only allow it once the agent has
  // submitted a deliverable (through settlement/dispute). This blocks reviews on
  // tasks that are still pending/accepted/running or were cancelled outright.
  if (!isTaskReviewable(task.status)) {
    return {
      ok: false,
      error: "You can only review a task after the agent has delivered work.",
    };
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
