import { route } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { clearSessionCookie, verifySessionCookie } from '@/lib/firebase/session';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/logout
 *
 * Clears the session cookie. Always succeeds — signing out must never fail,
 * or a user could be left unable to end a session they no longer trust.
 */
export const POST = route('POST /api/auth/logout', async () => {
  const decoded = await verifySessionCookie().catch(() => null);

  await clearSessionCookie();

  if (decoded) {
    logger.info('Session cleared', { firebaseUid: decoded.uid });
  }

  return apiSuccess({ signedOut: true }, { message: 'Signed out successfully' });
});
