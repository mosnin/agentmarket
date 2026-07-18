import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/health
 *
 * Public liveness/readiness probe. Runs a trivial DB query to confirm
 * connectivity to Postgres. Never throws: DB failures are caught and
 * reported as a degraded 503 without leaking error details.
 */
export async function GET() {
  const time = new Date().toISOString();

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "up", time });
  } catch (error) {
    console.error("GET /api/health failed", error);
    return NextResponse.json(
      { status: "degraded", db: "down", time },
      { status: 503 },
    );
  }
}
