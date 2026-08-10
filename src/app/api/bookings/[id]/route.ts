import type { NextRequest } from 'next/server';
import { route } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { requireUser, isAdmin } from '@/lib/firebase/auth';
import { objectIdSchema } from '@/lib/validation/common.schema';
import { cancelOwnBooking, getBooking } from '@/services/booking.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

/**
 * GET /api/bookings/[id] — customer-scoped.
 *
 * Ownership is enforced inside the query using the session-derived user id,
 * so another customer's id returns 404 rather than confirming it exists.
 */
export const GET = route<Context>(
  'GET /api/bookings/[id]',
  async (_request: NextRequest, { params }) => {
    const user = await requireUser();
    const { id } = await params;

    const booking = await getBooking(objectIdSchema.parse(id), {
      userId: String(user._id),
      isAdmin: isAdmin(user),
    });

    return apiSuccess({ booking });
  },
);

/** DELETE /api/bookings/[id] — customer cancels their own booking. */
export const DELETE = route<Context>(
  'DELETE /api/bookings/[id]',
  async (_request: NextRequest, { params }) => {
    const user = await requireUser();
    const { id } = await params;

    const booking = await cancelOwnBooking(
      objectIdSchema.parse(id),
      String(user._id),
    );

    return apiSuccess({ booking }, { message: 'Booking cancelled' });
  },
);
