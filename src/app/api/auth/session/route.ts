import type { NextRequest } from 'next/server';
import { route, readJsonBody, getClientIp } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { sessionSchema } from '@/lib/validation/auth.schema';
import { createSessionCookie, setSessionCookie } from '@/lib/firebase/session';
import { resolveAuthenticatedUser, toSessionUser } from '@/services/user.service';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/session
 *
 * Exchanges a Firebase ID token for an HTTP-only session cookie.
 *
 *   ID token → verifyIdToken() → createSessionCookie() → Set-Cookie
 *                                      ↓
 *                          MongoDB user upserted by firebaseUid
 *
 * The returned user comes from MongoDB, so the client receives the
 * authoritative role rather than whatever the token's claims happened to say.
 */
export const POST = route('POST /api/auth/session', async (request: NextRequest) => {
  enforceRateLimit('session', getClientIp(request));

  const body = await readJsonBody(request);
  const { idToken } = sessionSchema.parse(body);

  // Verifies signature, expiry, audience, issuer, and revocation.
  const { decoded, cookieValue, expiresInMs } = await createSessionCookie(idToken);

  // Creates the MongoDB record on first sign-in; enforces suspension after.
  const user = await resolveAuthenticatedUser(decoded);

  await setSessionCookie(cookieValue, expiresInMs);

  logger.info('Session established', {
    firebaseUid: user.firebaseUid,
    role: user.role,
  });

  return apiSuccess(
    { user: toSessionUser(user) },
    { message: 'Signed in successfully' },
  );
});
