/**
 * Auth provider configuration flags — intentionally dependency-free (no Prisma,
 * no Clerk runtime) so this module is safe to import from edge middleware as well
 * as server/client components.
 *
 * Real auth (Clerk) activates only when BOTH keys are present; otherwise the app
 * runs on the built-in mock operator (see `lib/auth.ts`).
 */

/** Server-side: real auth is fully configured (publishable + secret key). */
export const isRealAuthConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

/** Client-safe: only the publishable key is inlined into the browser bundle. */
export const isClerkPublishableConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);
