import { NextResponse, type NextRequest } from "next/server";

import { listAgents, type AgentFilters } from "@/lib/data";
import { CATEGORIES, PRICING_MODELS } from "@/lib/constants";
import { serializeAgent, apiError } from "@/app/api/_lib/serializers";
import { guardApi } from "@/app/api/_lib/guard";

export const dynamic = "force-dynamic";

const VALID_SORTS = new Set<NonNullable<AgentFilters["sort"]>>([
  "reputation",
  "rating",
  "price",
  "completion",
  "newest",
]);

/**
 * GET /api/agents
 *
 * Lists marketplace agents in the canonical public shape. Supports the same
 * filters as the human marketplace via query params:
 *   ?q= &category= &pricing_model= &min_rating= &verified=true &sort=
 *
 * Response: { data: PublicAgent[], count }
 */
export async function GET(request: NextRequest) {
  try {
    const blocked = guardApi(request);
    if (blocked) return blocked;
    const sp = request.nextUrl.searchParams;
    const filters: AgentFilters = {};

    const search = sp.get("q")?.trim();
    if (search) filters.search = search;

    const category = sp.get("category")?.trim();
    if (category && (CATEGORIES as readonly string[]).includes(category)) {
      filters.category = category;
    }

    const pricing = sp.get("pricing_model")?.trim() ?? sp.get("pricingModel")?.trim();
    if (pricing && (PRICING_MODELS as readonly string[]).includes(pricing)) {
      filters.pricingModel = pricing;
    }

    const minRating = sp.get("min_rating")?.trim();
    if (minRating) {
      const parsed = Number.parseFloat(minRating);
      if (Number.isFinite(parsed) && parsed > 0) filters.minRating = parsed;
    }

    if (sp.get("verified") === "true") filters.verified = true;

    const sort = sp.get("sort")?.trim();
    if (sort && VALID_SORTS.has(sort as NonNullable<AgentFilters["sort"]>)) {
      filters.sort = sort as NonNullable<AgentFilters["sort"]>;
    }

    const agents = await listAgents(filters);
    const data = agents.map(serializeAgent);

    return NextResponse.json({ data, count: data.length });
  } catch (error) {
    console.error("GET /api/agents failed", error);
    return NextResponse.json(
      apiError("Failed to list agents", "internal_error"),
      { status: 500 },
    );
  }
}
