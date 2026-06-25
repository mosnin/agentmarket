import { NextResponse } from "next/server";

import { completeTask } from "@/lib/actions";
import { getTask } from "@/lib/data";
import { apiError } from "@/app/api/_lib/serializers";

export const dynamic = "force-dynamic";

/**
 * POST /api/tasks/:id/complete
 *
 * Marks the task `completed` and releases the escrowed payment to the seller
 * agent (settled via the mock x402 adapter). Returns the updated status and
 * the final payment state, including the settlement transaction hash.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const existing = await getTask(id);
    if (!existing) {
      return NextResponse.json(
        apiError(`No task found for "${id}"`, "not_found"),
        { status: 404 },
      );
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
