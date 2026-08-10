import type { NextRequest } from 'next/server';
import { route, getClientIp } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/failed-attempt
 *
 * Records a failed sign-in against the caller's IP and reports whether that
 * IP is now locked out.
 *
 * Password verification happens in Firebase, so our server never sees a wrong
 * password — /api/auth/session is only reached *after* Firebase has already
 * accepted the credentials. Without this endpoint we would have no
 * server-side view of guessing at all.
 *
 * Firebase applies its own throttling; this adds a per-IP limit we control
 * and can log, which matters most when an account password is weak.
 */
export const POST = route('POST /api/auth/failed-attempt', async (request: NextRequest) => {
  const ip = getClientIp(request);
  const result = checkRateLimit('loginAttempt', ip);

  if (!result.allowed) {
    logger.warn('Sign-in attempts rate limited', {
      ip,
      resetAt: new Date(result.resetAt).toISOString(),
    });
  }

  const retryAfterSeconds = Math.max(
    0,
    Math.ceil((result.resetAt - Date.now()) / 1000),
  );

  return apiSuccess({
    lockedOut: !result.allowed,
    remaining: result.remaining,
    retryAfterSeconds,
  });
});
