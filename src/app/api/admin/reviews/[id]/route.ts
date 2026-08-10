import type { NextRequest } from 'next/server';
import { route, readJsonBody, getClientIp } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { requireAdmin } from '@/lib/firebase/auth';
import { objectIdSchema } from '@/lib/validation/common.schema';
import { moderateReviewSchema } from '@/lib/validation/review.schema';
import { moderateReview } from '@/services/content.service';
import { recordAudit } from '@/services/audit.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/reviews/[id] — approve or reject.
 * Approving recalculates the package's public rating.
 */
export const PATCH = route<{ params: Promise<{ id: string }> }>(
  'PATCH /api/admin/reviews/[id]',
  async (request: NextRequest, { params }) => {
    const admin = await requireAdmin();
    const { id } = await params;
    const reviewId = objectIdSchema.parse(id);

    const input = moderateReviewSchema.parse(await readJsonBody(request));

    const { previous, review } = await moderateReview(
      reviewId,
      input.status as 'approved' | 'rejected',
      String(admin._id),
      input.reason,
    );

    await recordAudit({
      actor: admin,
      action: 'review.moderated',
      entityType: 'Review',
      entityId: reviewId,
      changes: { status: { from: previous, to: input.status } },
      ip: getClientIp(request),
    });

    return apiSuccess({ review }, { message: `Review ${input.status}` });
  },
);
