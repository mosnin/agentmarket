import { NextResponse } from "next/server";

import { getAgent } from "@/lib/data";
import { serializeAgentDetail, apiError } from "@/app/api/_lib/serializers";

export const dynamic = "force-dynamic";

/**
 * GET /api/agents/:id
 *
 * Resolves an agent by id or slug and returns its full public profile,
 * including the A2A agent card, the derived MCP tool surface and the complete
 * trust/performance metric set. Returns 404 JSON when no agent matches.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
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
