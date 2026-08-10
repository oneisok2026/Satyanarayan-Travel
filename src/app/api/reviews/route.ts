import type { NextRequest } from 'next/server';
import { route, readJsonBody } from '@/lib/api-handler';
import { apiSuccess, buildPaginationMeta, cachePresets } from '@/lib/api-response';
import {
  createReviewSchema,
  reviewListQuerySchema,
} from '@/lib/validation/review.schema';
import { searchParamsToObject } from '@/lib/validation/common.schema';
import { createReview, listApprovedReviews } from '@/services/content.service';
import { requireUser } from '@/lib/firebase/auth';
import { enforceRateLimit } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';

/** GET /api/reviews — approved reviews only. */
export const GET = route('GET /api/reviews', async (request: NextRequest) => {
  const query = reviewListQuerySchema.parse(
    searchParamsToObject(request.nextUrl.searchParams),
  );

  const { reviews, total } = await listApprovedReviews(
    query.packageId,
    query.page,
    query.limit,
  );

  return apiSuccess(
    { reviews },
    {
      meta: buildPaginationMeta(query.page, query.limit, total),
      cacheControl: cachePresets.publicShort,
    },
  );
});

/**
 * POST /api/reviews — authenticated.
 *
 * Author identity comes from the session. The service additionally requires a
 * confirmed or completed booking for the package, so reviews cannot be
 * fabricated by an account that never travelled.
 */
export const POST = route('POST /api/reviews', async (request: NextRequest) => {
  const user = await requireUser();
  enforceRateLimit('review', String(user._id));

  const input = createReviewSchema.parse(await readJsonBody(request));

  const review = await createReview({
    userId: String(user._id),
    userName: user.name,
    userPhoto: user.photoURL,
    packageId: input.packageId,
    rating: input.rating,
    title: input.title,
    comment: input.comment,
    travelDate: input.travelDate,
  });

  return apiSuccess(
    { review },
    {
      status: 201,
      message: 'Thank you — your review has been submitted for moderation.',
    },
  );
});
