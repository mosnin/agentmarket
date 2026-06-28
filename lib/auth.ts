import { cache } from "react";
import type { Organization, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DEFAULT_ORG, DEFAULT_USER } from "@/lib/constants";

/**
 * Mock authentication.
 *
 * Agent Market ships with a local mock-auth adapter so the full marketplace loop
 * works with zero external configuration. Every request is signed in as a single
 * default operator who belongs to a default organization. Both are created on
 * first access (idempotent upsert) and mirror what the seed script inserts.
 *
 * To switch to Clerk: replace the body of `getCurrentUser` with a Clerk session
 * lookup (e.g. `auth()` from `@clerk/nextjs/server`) that resolves to a row in
 * the `User` table. The rest of the app only depends on this interface.
 */

export type CurrentUser = User & { organization: Organization | null };

export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const organization = await prisma.organization.upsert({
    where: { slug: DEFAULT_ORG.slug },
    update: {},
    create: {
      name: DEFAULT_ORG.name,
      slug: DEFAULT_ORG.slug,
      description: DEFAULT_ORG.description,
    },
  });

  // Demo note: the single mock operator is granted `admin` so the moderation
  // console is exercisable out of the box. With a real auth provider, `role` is
  // assigned by the provider / an admin grant — never hard-coded like this.
  const user = await prisma.user.upsert({
    where: { email: DEFAULT_USER.email },
    update: { organizationId: organization.id, role: "admin" },
    create: {
      email: DEFAULT_USER.email,
      name: DEFAULT_USER.name,
      organizationId: organization.id,
      role: "admin",
    },
    include: { organization: true },
  });

  return user;
});

export async function getCurrentUserId(): Promise<string> {
  return (await getCurrentUser()).id;
}

export async function getCurrentOrganization(): Promise<Organization | null> {
  return (await getCurrentUser()).organization;
}

/** True when a real auth provider (Clerk) is configured. */
export const isRealAuthConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);
