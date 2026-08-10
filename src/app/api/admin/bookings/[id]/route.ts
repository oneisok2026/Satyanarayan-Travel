import type { NextRequest } from 'next/server';
import { route, readJsonBody, getClientIp } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { requireAdmin } from '@/lib/firebase/auth';
import { objectIdSchema } from '@/lib/validation/common.schema';
import {
  updateBookingStatusSchema,
  updatePaymentStatusSchema,
} from '@/lib/validation/booking.schema';
import {
  getBooking,
  updateBookingStatus,
  updatePaymentStatus,
} from '@/services/booking.service';
import { recordAudit } from '@/services/audit.service';
import { validationError } from '@/lib/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export const GET = route<Context>(
  'GET /api/admin/bookings/[id]',
  async (_request, { params }) => {
    const admin = await requireAdmin();
    const { id } = await params;

    const booking = await getBooking(objectIdSchema.parse(id), {
      userId: String(admin._id),
      isAdmin: true,
    });

    return apiSuccess({ booking });
  },
);

/**
 * PATCH — booking status or payment status.
 *
 * Payment status is admin-only and audited: this is the field that decides
 * whether money is considered received, so it must never move silently.
 */
export const PATCH = route<Context>(
  'PATCH /api/admin/bookings/[id]',
  async (request: NextRequest, { params }) => {
    const admin = await requireAdmin();
    const { id } = await params;
    const bookingId = objectIdSchema.parse(id);
    const body = await readJsonBody(request);

    if (typeof body !== 'object' || body === null) {
      throw validationError('Invalid request body');
    }

    if ('paymentStatus' in body) {
      const { paymentStatus } = updatePaymentStatusSchema.parse(body);
      const { previous, booking } = await updatePaymentStatus(bookingId, paymentStatus);

      await recordAudit({
        actor: admin,
        action: 'booking.payment_changed',
        entityType: 'Booking',
        entityId: bookingId,
        changes: { paymentStatus: { from: previous, to: paymentStatus } },
        metadata: { bookingReference: booking.bookingReference },
        ip: getClientIp(request),
      });

      return apiSuccess({ booking }, { message: 'Payment status updated' });
    }

    const { status } = updateBookingStatusSchema.parse(body);
    const { previous, booking } = await updateBookingStatus(bookingId, status);

    await recordAudit({
      actor: admin,
      action: 'booking.status_changed',
      entityType: 'Booking',
      entityId: bookingId,
      changes: { status: { from: previous, to: status } },
      metadata: { bookingReference: booking.bookingReference },
      ip: getClientIp(request),
    });

    return apiSuccess({ booking }, { message: 'Booking updated' });
  },
);
