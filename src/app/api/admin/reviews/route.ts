import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { route } from '@/lib/api-handler';
import { apiSuccess, buildPaginationMeta } from '@/lib/api-response';
import { requireAdmin } from '@/lib/firebase/auth';
import { paginationSchema, searchParamsToObject } from '@/lib/validation/common.schema';
import { connectToDatabase } from '@/lib/db/connect';
import { Review } from '@/models/Review';
import { offsetFor } from '@/lib/validation/common.schema';
import { toReviewDTO } from '@/services/mappers';
import { REVIEW_STATUSES } from '@/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const querySchema = paginationSchema.extend({
  status: z.enum(REVIEW_STATUSES).optional(),
});

/** GET /api/admin/reviews — moderation queue, all statuses. */
export const GET = route('GET /api/admin/reviews', async (request: NextRequest) => {
  await requireAdmin();

  const query = querySchema.parse(
    searchParamsToObject(request.nextUrl.searchParams),
  );

  await connectToDatabase();

  const filter = query.status ? { status: query.status } : {};

  const [documents, total] = await Promise.all([
    Review.find(filter)
      .populate('packageId', 'title slug')
      .sort({ createdAt: -1 })
      .skip(offsetFor(query.page, query.limit))
      .limit(query.limit)
      .lean(),
    Review.countDocuments(filter),
  ]);

  return apiSuccess(
    { reviews: documents.map(toReviewDTO) },
    { meta: buildPaginationMeta(query.page, query.limit, total) },
  );
});
