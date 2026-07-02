import { cache } from "react";
import type { Organization, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DEFAULT_ORG, DEFAULT_USER } from "@/lib/constants";
import { isRealAuthConfigured } from "@/lib/authConfig";
import { getRequestPrincipal } from "@/lib/requestContext";

/**
 * Authentication.
 *
 * - **Real auth (Clerk)** is used when `isRealAuthConfigured` (both Clerk keys
 *   present). On a Clerk-authenticated request the session is resolved and a
 *   local `User` row is provisioned (find-or-create by email); real users default
 *   to the `user` role (never auto-admin — grant admin in the DB).
 * - **Mock operator** is the fallback: a single default admin operator, created
 *   on first access. It is also the service identity used for contexts that have
 *   no Clerk session in configured mode — notably the programmable agent API,
 *   which authenticates via bearer tokens (`lib/apiAuth.ts`) rather than a Clerk
 *   session. (Per-token → user mapping for the agent API is the documented next
 *   step; until then API calls act as this trusted service operator.)
 *
 * The rest of the app depends only on `getCurrentUser`; every privileged
 * operation funnels through `lib/authz.ts`, so swapping providers stays local.
 */

export type CurrentUser = User & { organization: Organization | null };

export { isRealAuthConfigured } from "@/lib/authConfig";

/** Idempotently ensure the default organization exists; returns its id. */
async function ensureDefaultOrgId(): Promise<string> {
  const org = await prisma.organization.upsert({
    where: { slug: DEFAULT_ORG.slug },
    update: {},
    create: {
      name: DEFAULT_ORG.name,
      slug: DEFAULT_ORG.slug,
      description: DEFAULT_ORG.description,
    },
  });
  return org.id;
}

/** Find-or-create the local `User` row for an authenticated external identity. */
async function provisionUser(identity: {
  email: string;
  name: string | null;
}): Promise<CurrentUser> {
  const found = await prisma.user.findUnique({
    where: { email: identity.email },
    include: { organization: true },
  });
  if (found) return found;
  const organizationId = await ensureDefaultOrgId();
  return prisma.user.create({
    data: {
      email: identity.email,
      name: identity.name ?? undefined,
      organizationId,
    },
    include: { organization: true },
  });
}

/** The built-in mock operator (admin), used when real auth isn't configured. */
async function getMockUser(): Promise<CurrentUser> {
  // Fast path: the operator already exists — a single read, no writes.
  const existing = await prisma.user.findUnique({
    where: { email: DEFAULT_USER.email },
    include: { organization: true },
  });
  if (existing?.organization && existing.role === "admin") {
    return existing;
  }
  // Cold start (or role/org drift): provision the operator as admin. Demo-only —
  // with a real provider, `role` is assigned in the DB / by an admin grant.
  const organizationId = await ensureDefaultOrgId();
  return prisma.user.upsert({
    where: { email: DEFAULT_USER.email },
    update: { organizationId, role: "admin" },
    create: {
      email: DEFAULT_USER.email,
      name: DEFAULT_USER.name,
      organizationId,
      role: "admin",
    },
    include: { organization: true },
  });
}

export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  // Agent-API context: a bearer token mapped to a specific principal takes
  // precedence, so the request runs AS that user (subject to the same authz).
  const apiPrincipal = getRequestPrincipal();
  if (apiPrincipal?.email) {
    return provisionUser({ email: apiPrincipal.email, name: null });
  }

  if (isRealAuthConfigured) {
    // Load the Clerk runtime only when configured.
    const { auth, currentUser } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    if (userId) {
      const cu = await currentUser();
      const email =
        cu?.primaryEmailAddress?.emailAddress ??
        cu?.emailAddresses?.[0]?.emailAddress ??
        null;
      if (email) {
        const name =
          [cu?.firstName, cu?.lastName].filter(Boolean).join(" ").trim() ||
          cu?.username ||
          null;
        return provisionUser({ email, name });
      }
    }
    // No Clerk session in this context (e.g. the bearer-authenticated agent API):
    // fall through to the service operator so server-side reads still resolve.
  }
  return getMockUser();
});

export async function getCurrentUserId(): Promise<string> {
  return (await getCurrentUser()).id;
}

export async function getCurrentOrganization(): Promise<Organization | null> {
  return (await getCurrentUser()).organization;
}
