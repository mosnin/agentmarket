import { NextResponse } from "next/server";

import { getTask } from "@/lib/data";
import { serializeTaskDetail, apiError } from "@/app/api/_lib/serializers";

export const dynamic = "force-dynamic";

/**
 * GET /api/tasks/:id
 *
 * Returns the full public task payload — contract, artifacts, payment and the
 * x402 payment requirement. Returns 404 JSON when the task does not exist.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const task = await getTask(id);

    if (!task) {
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
