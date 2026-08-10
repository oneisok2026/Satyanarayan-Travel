import { route } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { requireUser } from '@/lib/firebase/auth';
import { listUserReviews } from '@/services/content.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/users/me/reviews — the caller's own reviews, including any still
 * pending moderation. Scoped by the session-derived user id.
 */
export const GET = route('GET /api/users/me/reviews', async () => {
  const user = await requireUser();
  const reviews = await listUserReviews(String(user._id));
  return apiSuccess({ reviews });
});
