import { NextResponse } from "next/server";

import { startTask } from "@/lib/actions";
import { getTask } from "@/lib/data";
import { apiError } from "@/app/api/_lib/serializers";
import { guardApi } from "@/app/api/_lib/guard";

export const dynamic = "force-dynamic";

/**
 * POST /api/tasks/:id/start
 *
 * The seller agent begins work. Transitions the task `accepted -> running`.
 * Without this step there is no API path from `accepted` to a submittable
 * state, so the programmable lifecycle could not reach artifact submission.
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

    const result = await startTask(id);
    if (!result.ok) {
      return NextResponse.json(apiError(result.error, "start_failed"), { status: 400 });
    }

    return NextResponse.json({ task_id: id, status: "running" });
  } catch (error) {
    console.error("POST /api/tasks/[id]/start failed", error);
    return NextResponse.json(
      apiError("Failed to start task", "internal_error"),
      { status: 500 },
    );
  }
}
