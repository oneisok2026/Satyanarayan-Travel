import 'server-only';

import { cookies } from 'next/headers';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getAdminAuth } from './admin';
import { serverEnv, isProduction } from '@/lib/env';
import { logger } from '@/lib/logger';
import { unauthenticated } from '@/lib/errors';

/**
 * Firebase session cookies.
 *
 * Implements the flow in system-architecture.md §3: a short-lived ID token is
 * verified with the Admin SDK, then exchanged for a long-lived HTTP-only
 * session cookie that server code can trust on subsequent requests.
 */

const FIVE_MINUTES_MS = 5 * 60 * 1000;

function cookieName(): string {
  return serverEnv().SESSION_COOKIE_NAME;
}

function sessionMaxAgeMs(): number {
  return serverEnv().SESSION_COOKIE_DAYS * 24 * 60 * 60 * 1000;
}

/** Verifies a raw Firebase ID token. Used for the session exchange. */
export async function verifyIdToken(idToken: string): Promise<DecodedIdToken> {
  try {
    // checkRevoked: a token issued before a forced sign-out must not work.
    return await getAdminAuth().verifyIdToken(idToken, true);
  } catch (error) {
    logger.warn('ID token verification failed', {
      reason: error instanceof Error ? error.message : 'unknown',
    });
    throw unauthenticated('Your sign-in could not be verified. Please sign in again.');
  }
}

/**
 * Mints a session cookie from a freshly-issued ID token.
 *
 * Firebase requires the ID token to be less than 5 minutes old to create a
 * session cookie, which is what makes the cookie meaningfully "recent login".
 */
export async function createSessionCookie(idToken: string): Promise<{
  decoded: DecodedIdToken;
  cookieValue: string;
  expiresInMs: number;
}> {
  const decoded = await verifyIdToken(idToken);

  const authTimeMs = decoded.auth_time * 1000;
  if (Date.now() - authTimeMs > FIVE_MINUTES_MS) {
    throw unauthenticated('Your sign-in has expired. Please sign in again.');
  }

  const expiresInMs = sessionMaxAgeMs();

  try {
    const cookieValue = await getAdminAuth().createSessionCookie(idToken, {
      expiresIn: expiresInMs,
    });
    return { decoded, cookieValue, expiresInMs };
  } catch (error) {
    logger.error('Failed to create session cookie', {
      error: error instanceof Error ? error : String(error),
    });
    throw unauthenticated('Could not start your session. Please try again.');
  }
}

/** Writes the session cookie. HTTP-only, Secure in production, SameSite=Lax. */
export async function setSessionCookie(value: string, maxAgeMs: number): Promise<void> {
  const store = await cookies();
  store.set(cookieName(), value, {
    httpOnly: true,
    secure: isProduction,
    // Lax keeps the cookie on top-level navigations back from Google sign-in
    // while still blocking cross-site POSTs.
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(maxAgeMs / 1000),
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(cookieName(), '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export async function readSessionCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(cookieName())?.value ?? null;
}

/**
 * Verifies the session cookie on an incoming request.
 *
 * Returns null rather than throwing, because "not signed in" is a normal state
 * for public pages. Call sites that require a user use requireUser() instead.
 */
export async function verifySessionCookie(): Promise<DecodedIdToken | null> {
  const cookieValue = await readSessionCookie();
  if (!cookieValue) return null;

  try {
    // checkRevoked hits Firebase to confirm the session wasn't revoked
    // server-side (disabled account, forced sign-out, password change).
    return await getAdminAuth().verifySessionCookie(cookieValue, true);
  } catch (error) {
    const code =
      error instanceof Error && 'code' in error
        ? (error as { code: string }).code
        : 'unknown';
    // Expiry is routine, not an incident — log it quietly.
    if (code !== 'auth/session-cookie-expired') {
      logger.warn('Session cookie verification failed', { code });
    }
    return null;
  }
}

/**
 * Revokes every refresh token for a user, invalidating all their sessions
 * across devices. Used on account suspension and forced sign-out.
 */
export async function revokeUserSessions(firebaseUid: string): Promise<void> {
  try {
    await getAdminAuth().revokeRefreshTokens(firebaseUid);
    logger.info('Revoked all sessions for user', { firebaseUid });
  } catch (error) {
    logger.error('Failed to revoke sessions', {
      firebaseUid,
      error: error instanceof Error ? error : String(error),
    });
    throw error;
  }
}

/** Sets the role custom claim used as an authorization *hint* on the client. */
export async function setRoleClaim(firebaseUid: string, role: string): Promise<void> {
  await getAdminAuth().setCustomUserClaims(firebaseUid, { role });
}
