import { NextResponse, type NextRequest } from "next/server";

import { listAgents, getAgent, getTask, listTasks } from "@/lib/data";
import { createTask } from "@/lib/actions";
import { apiCreateTaskSchema } from "@/lib/schemas";
import { CATEGORIES, TASK_STATUSES, type Category } from "@/lib/constants";
import type { CreateTaskInput } from "@/lib/schemas";
import { serializeTaskListItem, apiError } from "@/app/api/_lib/serializers";
import { guardApi } from "@/app/api/_lib/guard";
import { readJsonBody } from "@/lib/apiAuth";
import { verifyPayment } from "@/lib/payments/x402Adapter";

export const dynamic = "force-dynamic";

/**
 * GET /api/tasks
 *
 * Lists recent tasks in the public shape. Supports `?status=` and `?category=`
 * filters plus a `?limit=` cap (default 20, max 100).
 */
export async function GET(request: NextRequest) {
  try {
    const blocked = guardApi(request);
    if (blocked) return blocked;
    const sp = request.nextUrl.searchParams;
    const filters: { status?: string; category?: string; visibility?: string } = {
      // The public agent API only ever exposes public tasks — private/unlisted
      // tasks must not be enumerable here.
      visibility: "public",
    };

    // Allow-list the status filter (like `category` below): an unrecognized
    // value would otherwise reach Prisma as an invalid enum and throw a 500.
    const status = sp.get("status")?.trim();
    if (status && (TASK_STATUSES as readonly string[]).includes(status)) {
      filters.status = status;
    }

    const category = sp.get("category")?.trim();
    if (category && (CATEGORIES as readonly string[]).includes(category)) {
      filters.category = category;
    }

    const limitRaw = Number.parseInt(sp.get("limit") ?? "", 10);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 100)
      : 20;

    const tasks = await listTasks(filters);
    const data = tasks.slice(0, limit).map(serializeTaskListItem);

    return NextResponse.json({ data, count: data.length });
  } catch (error) {
    console.error("GET /api/tasks failed", error);
    return NextResponse.json(
      apiError("Failed to list tasks", "internal_error"),
      { status: 500 },
    );
  }
}

/**
 * POST /api/tasks
 *
 * The core "hire an agent" endpoint. Accepts a minimal, agent-friendly body
 * (snake_case or camelCase) validated by `apiCreateTaskSchema`:
 *
 *   {
 *     "objective": "Enrich 500 Shopify leads with founder emails",
 *     "category": "Growth",
 *     "budget": 25,
 *     "output_schema": { ... }
 *   }
 *
 * Resolution rules:
 *   - If `seller_agent_id` is supplied, that agent is hired directly.
 *   - Otherwise the highest-reputation active agent in `category` is selected.
 *   - A `mock_escrow` contract is created and funds are escrowed immediately.
 *
 * Returns 201 with { task_id, status, payment, seller_agent } or 400 on a
 * validation / resolution error.
 */
export async function POST(request: NextRequest) {
  try {
    const blocked = guardApi(request, { write: true });
    if (blocked) return blocked;

    const bodyResult = await readJsonBody(request);
    if (!bodyResult.ok) {
      return NextResponse.json(apiError(bodyResult.error, "invalid_body"), {
        status: bodyResult.status,
      });
    }
    const raw = bodyResult.body;

    const parsed = apiCreateTaskSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        apiError(parsed.error.issues[0]?.message ?? "Invalid request body", "validation_error"),
        { status: 400 },
      );
    }

    const body = parsed.data;
    const category = (body.category ?? "Growth") as Category;

    // --- Resolve the seller agent (explicit id wins, else first by category). ---
    const requestedAgentId = body.seller_agent_id ?? body.sellerAgentId;
    let sellerAgentId: string | undefined;
    let resolvedCategory: Category = category;

    if (requestedAgentId) {
      const agent = await getAgent(requestedAgentId);
      if (!agent) {
        return NextResponse.json(
          apiError(`No agent found for "${requestedAgentId}"`, "agent_not_found"),
          { status: 400 },
        );
      }
      sellerAgentId = agent.id;
      if ((CATEGORIES as readonly string[]).includes(agent.category)) {
        resolvedCategory = agent.category as Category;
      }
    } else {
      const candidates = await listAgents({ category, sort: "reputation" });
      const match = candidates[0];
      if (!match) {
        return NextResponse.json(
          apiError(`No available agent in category "${category}"`, "no_agent_available"),
          { status: 400 },
        );
      }
      sellerAgentId = match.id;
    }

    // --- Map the public body onto the internal CreateTaskInput contract. ---
    const objective = body.objective.trim();
    const title = (body.title?.trim() || objective).slice(0, 140);
    const outputSchema = body.output_schema ?? body.outputSchema;
    const inputPayload = body.input_payload;

    const input: CreateTaskInput = {
      title,
      objective,
      category: resolvedCategory,
      sellerAgentId,
      inputInstructions: inputPayload ? JSON.stringify(inputPayload, null, 2) : undefined,
      inputDataUrl: body.input_data_url,
      outputFormat: "JSON",
      budget: body.budget,
      validationRules: outputSchema
        ? `Output must conform to the provided JSON schema: ${JSON.stringify(outputSchema)}`
        : undefined,
      paymentMode: body.payment_mode ?? body.paymentMode ?? "mock_escrow",
      visibility: "public",
    };

    // For escrow-backed tasks, run the funds through the x402 verifier before
    // we create the task + escrow the payment, mirroring a real x402 facilitator
    // checking the payment proof.
    if (input.paymentMode === "mock_escrow") {
      const verification = await verifyPayment({
        taskId: `pending:${sellerAgentId}`,
        amount: body.budget,
      });
      if (!verification.verified) {
        return NextResponse.json(
          apiError(verification.reason ?? "Payment could not be verified", "payment_unverified"),
          { status: 402 },
        );
      }
    }

    const result = await createTask(input);
    if (!result.ok) {
      return NextResponse.json(
        apiError(result.error, "create_failed"),
        { status: 400 },
      );
    }

    // --- Re-read the created task to surface payment + seller details. ---
    const task = await getTask(result.taskId);
    if (!task) {
      // Extremely unlikely, but keep the contract well-typed.
      return NextResponse.json(
        apiError("Task created but could not be retrieved", "internal_error"),
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        task_id: task.id,
        status: task.status,
        payment: {
          mode: task.payment?.mode ?? input.paymentMode,
          status: task.payment?.status ?? "pending",
          amount: task.payment?.amount ?? task.budget,
          currency: task.payment?.currency ?? task.currency,
        },
        seller_agent: task.sellerAgent
          ? { id: task.sellerAgent.id, name: task.sellerAgent.name }
          : null,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/tasks failed", error);
    return NextResponse.json(
      apiError("Failed to create task", "internal_error"),
      { status: 500 },
    );
  }
}
