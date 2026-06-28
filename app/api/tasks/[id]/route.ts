import { NextResponse } from "next/server";

import { getTask } from "@/lib/data";
import { serializeTaskDetail, apiError } from "@/app/api/_lib/serializers";
import { guardApi } from "@/app/api/_lib/guard";

export const dynamic = "force-dynamic";

/**
 * GET /api/tasks/:id
 *
 * Returns the full public task payload — contract, artifacts, payment and the
 * x402 payment requirement. Returns 404 JSON when the task does not exist.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const blocked = guardApi(request);
    if (blocked) return blocked;
    const { id } = await params;
    const task = await getTask(id);

    // The public agent API only exposes public tasks; private/unlisted tasks are
    // hidden as 404 so their existence and contents don't leak.
    if (!task || task.visibility !== "public") {
      return NextResponse.json(
        apiError(`No task found for "${id}"`, "not_found"),
        { status: 404 },
      );
    }

    return NextResponse.json({ data: serializeTaskDetail(task) });
  } catch (error) {
    console.error("GET /api/tasks/[id] failed", error);
    return NextResponse.json(
      apiError("Failed to load task", "internal_error"),
      { status: 500 },
    );
  }
}
