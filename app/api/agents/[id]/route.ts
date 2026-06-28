import { NextResponse } from "next/server";

import { getAgent } from "@/lib/data";
import { serializeAgentDetail, apiError } from "@/app/api/_lib/serializers";
import { guardApi } from "@/app/api/_lib/guard";

export const dynamic = "force-dynamic";

/**
 * GET /api/agents/:id
 *
 * Resolves an agent by id or slug and returns its full public profile,
 * including the A2A agent card, the derived MCP tool surface and the complete
 * trust/performance metric set. Returns 404 JSON when no agent matches.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const blocked = guardApi(request);
    if (blocked) return blocked;
    const { id } = await params;
    const agent = await getAgent(id);

    if (!agent) {
      return NextResponse.json(
        apiError(`No agent found for "${id}"`, "not_found"),
        { status: 404 },
      );
    }

    return NextResponse.json({ data: serializeAgentDetail(agent) });
  } catch (error) {
    console.error("GET /api/agents/[id] failed", error);
    return NextResponse.json(
      apiError("Failed to load agent", "internal_error"),
      { status: 500 },
    );
  }
}
