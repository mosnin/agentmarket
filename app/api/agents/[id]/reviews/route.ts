import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { apiError } from "@/app/api/_lib/serializers";
import { guardApi } from "@/app/api/_lib/guard";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * GET /api/agents/:id/reviews
 *
 * Public, paginated reviews for one agent (resolved by id or slug). Gated the
 * same way as `GET /api/agents/:id`: only `active` agents are exposed, so
 * draft/suspended/archived listings 404 here too rather than leaking review
 * content for a listing that isn't publicly visible.
 *
 * Query params:
 *   ?limit=  page size, default 20, clamped to 1..100
 *   ?cursor= a review id to resume after (cursor pagination)
 *
 * Response: `{ data, count, next_cursor }`, where `count` is the number of
 * items in `data` (matching the convention of `GET /api/agents` and
 * `GET /api/tasks`) and `next_cursor` is the id to pass as `?cursor=` to fetch
 * the next page, or `null` once there's nothing left.
 *
 * Each review is serialized with no PII beyond the reviewer's display name —
 * their email is never selected from the database, let alone returned.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const blocked = guardApi(request);
    if (blocked) return blocked;
    const { id } = await params;

    // Lean lookup — only what the active-only gate needs. Deliberately not
    // `getAgent` from lib/data.ts, which eagerly includes capabilities,
    // tasks, reputation events, etc. for the full agent-detail payload.
    const agent = await prisma.agent.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true, status: true },
    });

    // Same 404 shape/gate as GET /api/agents/:id: draft/suspended/archived
    // agents are 404 (not just filtered), so their existence and reviews
    // aren't enumerable via this endpoint either.
    if (!agent || agent.status !== "active") {
      return NextResponse.json(
        apiError(`No agent found for "${id}"`, "not_found"),
        { status: 404 },
      );
    }

    const sp = request.nextUrl.searchParams;

    const limitRaw = Number.parseInt(sp.get("limit") ?? "", 10);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), MAX_LIMIT)
      : DEFAULT_LIMIT;

    const cursor = sp.get("cursor")?.trim() || undefined;

    // Fetch one extra row beyond `limit` so we can tell whether another page
    // exists without a client round-trip that comes back empty. A stale or
    // unknown cursor (e.g. a deleted review) isn't an error to Prisma — it
    // just seeks to an empty tail, so no special-case handling is needed
    // (verified against a live Review table before writing this).
    const rows = await prisma.review.findMany({
      where: { agentId: agent.id },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        user: { select: { name: true } },
        task: { select: { id: true, title: true } },
      },
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    const data = page.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      reviewer: review.user.name ?? "Anonymous",
      task: review.task ? { id: review.task.id, title: review.task.title } : null,
      created_at: review.createdAt.toISOString(),
    }));

    const next_cursor = hasMore ? data[data.length - 1]!.id : null;

    return NextResponse.json({ data, count: data.length, next_cursor });
  } catch (error) {
    console.error("GET /api/agents/[id]/reviews failed", error);
    return NextResponse.json(
      apiError("Failed to load reviews", "internal_error"),
      { status: 500 },
    );
  }
}
