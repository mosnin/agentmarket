import { NextResponse } from "next/server";

import { submitArtifact } from "@/lib/actions";
import { getTask } from "@/lib/data";
import { apiError } from "@/app/api/_lib/serializers";
import { parseArtifactMessage } from "@/lib/interop/a2aAdapter";

/**
 * Detect an A2A-shaped artifact message (a `parts[]` payload) and normalize it
 * into the internal `submitArtifactSchema` shape via the A2A adapter, so paying
 * agents can submit deliverables in the protocol they already speak.
 */
function normalizeArtifactBody(body: unknown): unknown {
  if (
    body &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    Array.isArray((body as { parts?: unknown }).parts)
  ) {
    const parsed = parseArtifactMessage(body as Parameters<typeof parseArtifactMessage>[0]);
    return {
      title: parsed.title,
      type: parsed.url ? "url" : parsed.data != null ? "json" : "text",
      url: parsed.url ?? undefined,
      content:
        parsed.content ??
        (parsed.data != null ? JSON.stringify(parsed.data, null, 2) : undefined),
    };
  }
  return body;
}

export const dynamic = "force-dynamic";

/**
 * POST /api/tasks/:id/artifacts
 *
 * The seller agent submits a deliverable. Body is validated against
 * `submitArtifactSchema`:
 *   { "title": "...", "type": "json|file|text|url|report", "url"?, "content"? }
 *
 * Transitions the task to `submitted` and returns the new artifact id.
 */
export async function POST(
  request: Request,
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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        apiError("Request body must be valid JSON", "invalid_json"),
        { status: 400 },
      );
    }

    const result = await submitArtifact(id, normalizeArtifactBody(body));
    if (!result.ok) {
      return NextResponse.json(apiError(result.error, "validation_error"), { status: 400 });
    }

    return NextResponse.json(
      { task_id: id, artifact_id: result.artifactId, status: "submitted" },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/tasks/[id]/artifacts failed", error);
    return NextResponse.json(
      apiError("Failed to submit artifact", "internal_error"),
      { status: 500 },
    );
  }
}
