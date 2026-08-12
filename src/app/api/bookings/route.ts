import type { NextRequest } from 'next/server';
import { route, readJsonBody, getClientIp } from '@/lib/api-handler';
import { apiSuccess, buildPaginationMeta } from '@/lib/api-response';
import { createBookingSchema } from '@/lib/validation/booking.schema';
import { paginationSchema, searchParamsToObject } from '@/lib/validation/common.schema';
import { createBooking, listUserBookings } from '@/services/booking.service';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import { getCurrentUser, requireUser } from '@/lib/firebase/auth';
import { notifyBookingCreated } from '@/services/notification.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/bookings — open to guests.
 *
 * A booking request is the start of a conversation with the agency, so it does
 * not require an account: the public package cards submit here directly. When
 * a session exists the booking is attached to it, so it still appears in that
 * customer's own history.
 *
 * Pricing is always computed server-side from the stored package price;
 * nothing about money is read from the request.
 */
export const POST = route('POST /api/bookings', async (request: NextRequest) => {
  const user = await getCurrentUser();

  // Signed-in requests are limited per account; guests per IP, which is the
  // only stable key available for them.
  enforceRateLimit('booking', user ? String(user._id) : `ip:${getClientIp(request)}`);

  const body = await readJsonBody(request);
  const input = createBookingSchema.parse(body);

  const booking = await createBooking({
    ...(user ? { userId: String(user._id) } : {}),
    packageId: input.packageId,
    travelDate: input.travelDate,
    travellers: input.travellers,
    contact: input.contact,
    notes: input.notes,
    idempotencyKey: input.idempotencyKey,
  });

  // The booking is already committed; delivery failure must not fail the call.
  await notifyBookingCreated({
    bookingReference: booking.bookingReference,
    customerName: booking.contact.name,
    customerEmail: booking.contact.email,
    packageTitle: booking.packageRef.title,
    travelDate: new Date(booking.travelDate).toLocaleDateString('en-IN'),
    travellers: booking.travellers.length,
    total: `INR ${booking.pricingSnapshot.total.toLocaleString('en-IN')}`,
  }).catch(() => undefined);

  return apiSuccess(
    { booking },
    {
      status: 201,
      message: `Booking request received. Your reference is ${booking.bookingReference}.`,
    },
  );
});

/** GET /api/bookings — the signed-in customer's own bookings. */
export const GET = route('GET /api/bookings', async (request: NextRequest) => {
  const user = await requireUser();
  const { page, limit } = paginationSchema.parse(
    searchParamsToObject(request.nextUrl.searchParams),
  );

  const { bookings, total } = await listUserBookings(String(user._id), page, limit);

  return apiSuccess({ bookings }, { meta: buildPaginationMeta(page, limit, total) });
});
