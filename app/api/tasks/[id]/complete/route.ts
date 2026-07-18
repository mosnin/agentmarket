import { NextResponse } from "next/server";

import { completeTask } from "@/lib/actions";
import { getTask } from "@/lib/data";
import { VALIDATION_PASS_THRESHOLD } from "@/lib/constants";
import { apiError } from "@/app/api/_lib/serializers";
import { guardApi } from "@/app/api/_lib/guard";

export const dynamic = "force-dynamic";

/**
 * POST /api/tasks/:id/complete
 *
 * Marks the task `completed` and releases the escrowed payment to the seller
 * agent (settled via the mock x402 adapter). Returns the updated status and
 * the final payment state, including the settlement transaction hash.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const blocked = guardApi(request, { write: true });
    if (blocked) return blocked;
    const { id } = await params;

    const existing = await getTask(id);
    if (!existing) {
      return NextResponse.json(
        apiError(`No task found for "${id}"`, "not_found"),
        { status: 404 },
      );
    }

    // Enforce the §11 validation gate that the human UI also enforces: payment
    // can only be released after the latest artifact has passed validation.
    // `getTask` returns artifacts ordered by `createdAt` desc, so artifacts[0]
    // is the most recently submitted deliverable.
    if (existing.status !== "completed") {
      const isSettleable =
        existing.status === "validating" || existing.status === "submitted";
      const latestArtifact = existing.artifacts[0] ?? null;
      const passedValidation =
        latestArtifact?.validationStatus === "passed" &&
        (latestArtifact.validationScore ?? 0) >= VALIDATION_PASS_THRESHOLD;

      if (!isSettleable || !passedValidation) {
        return NextResponse.json(
          apiError(
            "Task cannot be completed: the latest artifact must pass validation " +
              `(status \"passed\", score ≥ ${VALIDATION_PASS_THRESHOLD}) before payment is released.`,
            "validation_required",
          ),
          { status: 409 },
        );
      }
    }

    const result = await completeTask(id);
    if (!result.ok) {
      return NextResponse.json(apiError(result.error, "complete_failed"), { status: 400 });
    }

    const task = await getTask(id);

    return NextResponse.json({
      task_id: id,
      status: task?.status ?? "completed",
      payment: task?.payment
        ? {
            mode: task.payment.mode,
            status: task.payment.status,
            amount: task.payment.amount,
            currency: task.payment.currency,
            transaction_hash: task.payment.transactionHash ?? null,
          }
        : null,
    });
  } catch (error) {
    console.error("POST /api/tasks/[id]/complete failed", error);
    return NextResponse.json(
      apiError("Failed to complete task", "internal_error"),
      { status: 500 },
    );
  }
}
