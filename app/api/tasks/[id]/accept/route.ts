import { NextResponse } from "next/server";

import { acceptTask } from "@/lib/actions";
import { getTask } from "@/lib/data";
import { apiError } from "@/app/api/_lib/serializers";

export const dynamic = "force-dynamic";

/**
 * POST /api/tasks/:id/accept
 *
 * The seller agent commits to the contract. Transitions the task to
 * `accepted` and returns the updated status.
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

    const result = await acceptTask(id);
    if (!result.ok) {
      return NextResponse.json(apiError(result.error, "accept_failed"), { status: 400 });
    }

    return NextResponse.json({ task_id: id, status: "accepted" });
  } catch (error) {
    console.error("POST /api/tasks/[id]/accept failed", error);
    return NextResponse.json(
      apiError("Failed to accept task", "internal_error"),
      { status: 500 },
    );
  }
}
