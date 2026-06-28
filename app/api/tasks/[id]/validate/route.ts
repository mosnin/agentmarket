import { NextResponse } from "next/server";

import { runValidation } from "@/lib/actions";
import { getTask } from "@/lib/data";
import { apiError } from "@/app/api/_lib/serializers";
import { guardApi } from "@/app/api/_lib/guard";

export const dynamic = "force-dynamic";

/**
 * POST /api/tasks/:id/validate
 *
 * Runs the mock validator against the latest submitted artifact, scoring it
 * against the contract's output schema + success criteria. Returns the score
 * (0–100), a `passed` flag and the resulting task status.
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

    const result = await runValidation(id);
    if (!result.ok) {
      return NextResponse.json(apiError(result.error, "validation_failed"), { status: 400 });
    }

    const task = await getTask(id);

    return NextResponse.json({
      task_id: id,
      score: result.score,
      passed: result.passed,
      status: task?.status ?? "validating",
    });
  } catch (error) {
    console.error("POST /api/tasks/[id]/validate failed", error);
    return NextResponse.json(
      apiError("Failed to validate task", "internal_error"),
      { status: 500 },
    );
  }
}
