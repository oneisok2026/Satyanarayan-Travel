import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';
import { verifySessionCookie, verifyIdToken } from './session';
import { resolveAuthenticatedUser } from '@/services/user.service';
import type { UserDocument } from '@/models/User';
import { forbidden, unauthenticated } from '@/lib/errors';
import { ADMIN_ROLES, type UserRole } from '@/constants';

/**
 * Server-side authentication and authorization.
 *
 * This module is the only sanctioned way to learn who is making a request.
 * The pipeline is always:
 *
 *   session cookie → verifySessionCookie() → firebaseUid
 *   → MongoDB User → status check → role check → authorize
 *
 * Client-supplied identity (body.userId, body.role, headers, localStorage) is
 * never consulted. Role is read from MongoDB, not from the token's custom
 * claims, so a stale claim cannot escalate privileges.
 */

/**
 * Current user, or null when signed out.
 *
 * Wrapped in React `cache` so multiple components in one render share a single
 * verification + database lookup instead of repeating it per call.
 */
export const getCurrentUser = cache(async (): Promise<UserDocument | null> => {
  const decoded = await verifySessionCookie();
  if (!decoded) return null;

  try {
    return await resolveAuthenticatedUser(decoded);
  } catch {
    // Suspended/deleted accounts resolve as "not signed in" for page rendering;
    // API routes surface the specific error via requireUser().
    return null;
  }
});

/** Current user or throw. For Route Handlers. */
export async function requireUser(): Promise<UserDocument> {
  const decoded = await verifySessionCookie();
  if (!decoded) throw unauthenticated();
  // Throws AccountSuspended for disabled accounts rather than swallowing it.
  return resolveAuthenticatedUser(decoded);
}

/** Require one of the given roles. For Route Handlers. */
export async function requireRole(
  ...roles: readonly UserRole[]
): Promise<UserDocument> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw forbidden();
  }
  return user;
}

/** Require admin or super_admin. For Route Handlers. */
export async function requireAdmin(): Promise<UserDocument> {
  return requireRole(...ADMIN_ROLES);
}

/** Require super_admin. For destructive operations. */
export async function requireSuperAdmin(): Promise<UserDocument> {
  return requireRole('super_admin');
}

/**
 * Page-level guard. Redirects rather than throwing, preserving the intended
 * destination so the user lands back where they started after signing in.
 */
export async function requireUserPage(returnTo: string): Promise<UserDocument> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  }
  return user;
}

/** Page-level admin guard. Non-admins get 404, not 403 — the admin area
 *  should not confirm its own existence to a signed-in customer. */
export async function requireAdminPage(returnTo: string): Promise<UserDocument> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  }
  if (!ADMIN_ROLES.includes(user.role)) {
    const { notFound: nextNotFound } = await import('next/navigation');
    nextNotFound();
  }
  return user;
}

/**
 * Bearer-token authentication for API clients that cannot hold cookies.
 * Falls back to the session cookie when no Authorization header is present.
 */
export async function requireUserFromRequest(
  request: NextRequest,
): Promise<UserDocument> {
  const header = request.headers.get('authorization');

  if (header?.startsWith('Bearer ')) {
    const idToken = header.slice(7).trim();
    if (!idToken) throw unauthenticated();
    const decoded = await verifyIdToken(idToken);
    return resolveAuthenticatedUser(decoded);
  }

  return requireUser();
}

export function isAdmin(user: Pick<UserDocument, 'role'> | null): boolean {
  return user != null && ADMIN_ROLES.includes(user.role);
}

/** Ownership check for customer-scoped resources. Admins bypass. */
export function assertOwnershipOrAdmin(
  user: UserDocument,
  ownerId: string | { toString(): string },
): void {
  if (isAdmin(user)) return;
  if (String(ownerId) !== String(user._id)) {
    throw forbidden();
  }
}
