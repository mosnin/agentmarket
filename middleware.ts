import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

import { isRealAuthConfigured } from "@/lib/authConfig";

/**
 * Authenticated app surfaces require a real session when Clerk is configured.
 * Public surfaces (landing, marketplace, agent profiles) stay open, and the
 * programmable agent API (`/api/*`) is excluded entirely — it authenticates via
 * bearer tokens (`lib/apiAuth.ts`), not Clerk sessions. When unconfigured this
 * middleware is a no-op passthrough, so local/demo runs are unchanged.
 */
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/seller(.*)",
  "/admin(.*)",
  "/agents/new",
  "/agents/(.*)/edit",
  "/tasks/new",
]);

export default isRealAuthConfigured
  ? clerkMiddleware(async (auth, req) => {
      if (isProtectedRoute(req)) await auth.protect();
    })
  : function middleware() {
      return NextResponse.next();
    };

export const config = {
  // Run on app routes; skip Next internals, static files, and the agent API.
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
