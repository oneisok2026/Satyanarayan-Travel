import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUserPage, isAdmin } from '@/lib/firebase/auth';
import { getBooking } from '@/services/booking.service';
import { objectIdSchema } from '@/lib/validation/common.schema';
import { StatusBadge } from '@/components/ui/Badge';
import { CancelBookingButton } from '@/components/account/CancelBookingButton';
import { isAppError } from '@/lib/errors';
import { formatDate, formatPrice } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Booking details',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUserPage('/account/bookings');
  const { id } = await params;

  const parsed = objectIdSchema.safeParse(id);
  if (!parsed.success) notFound();

  let booking;
  try {
    // Ownership is enforced in the query, so another user's id 404s here.
    booking = await getBooking(parsed.data, {
      userId: String(user._id),
      isAdmin: isAdmin(user),
    });
  } catch (error) {
    if (isAppError(error) && error.code === 'NOT_FOUND') notFound();
    throw error;
  }

  const pricing = booking.pricingSnapshot;
  const cancellable = booking.status === 'requested' || booking.status === 'pending_confirmation';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/account/bookings"
          className="text-sm text-brand-700 underline-offset-4 hover:underline"
        >
          ← Back to bookings
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-sand-900">
          {booking.packageRef.title}
        </h1>
        <p className="mt-1 font-mono text-sm text-sand-500">
          {booking.bookingReference}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusBadge.Booking status={booking.status} />
        <StatusBadge.Payment status={booking.paymentStatus} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-5">
          <section className="rounded-2xl bg-white p-5 ring-1 ring-sand-200">
            <h2 className="font-display text-lg font-semibold text-sand-900">
              Trip details
            </h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <Detail label="Travel date" value={formatDate(booking.travelDate)} />
              <Detail label="Travellers" value={String(booking.travellers.length)} />
              <Detail label="Booked on" value={formatDate(booking.createdAt)} />
              <Detail
                label="Package"
                value={
                  <Link
                    href={`/packages/${booking.packageRef.slug}`}
                    className="text-brand-700 underline-offset-4 hover:underline"
                  >
                    View package
                  </Link>
                }
              />
            </dl>
          </section>

          {booking.travellers.length > 0 && (
            <section className="rounded-2xl bg-white p-5 ring-1 ring-sand-200">
              <h2 className="font-display text-lg font-semibold text-sand-900">
                Travellers
              </h2>
              <ul className="mt-4 divide-y divide-sand-100">
                {booking.travellers.map((traveller, index) => (
                  <li
                    key={`${traveller.name}-${index}`}
                    className="flex items-center justify-between py-2.5 text-sm"
                  >
                    <span className="font-medium text-sand-900">{traveller.name}</span>
                    <span className="text-sand-600">
                      {traveller.age} years
                      {traveller.gender ? ` · ${traveller.gender}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {booking.notes && (
            <section className="rounded-2xl bg-white p-5 ring-1 ring-sand-200">
              <h2 className="font-display text-lg font-semibold text-sand-900">
                Your notes
              </h2>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-sand-600">
                {booking.notes}
              </p>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-5">
          <section className="rounded-2xl bg-white p-5 ring-1 ring-sand-200">
            <h2 className="font-display text-lg font-semibold text-sand-900">
              Price breakdown
            </h2>
            <dl className="mt-4 flex flex-col gap-2.5 text-sm">
              <Row
                label={`Adults × ${pricing.adults}`}
                value={formatPrice(pricing.adults * pricing.unitPrice)}
              />
              {pricing.children > 0 && (
                <Row
                  label={`Children × ${pricing.children}`}
                  value={formatPrice(pricing.children * pricing.childPrice)}
                />
              )}
              {/* Older bookings were priced with GST added on top; the row is
                  kept for those so their total still adds up. */}
              {pricing.taxes > 0 && (
                <>
                  <Row label="Subtotal" value={formatPrice(pricing.subtotal)} />
                  <Row label="Taxes" value={formatPrice(pricing.taxes)} />
                </>
              )}
              <div className="mt-1 flex items-center justify-between border-t border-sand-200 pt-3">
                <dt className="font-medium text-sand-900">Total</dt>
                <dd className="font-display text-xl font-semibold text-sand-900">
                  {formatPrice(pricing.total)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl bg-white p-5 ring-1 ring-sand-200">
            <h2 className="font-display text-lg font-semibold text-sand-900">Contact</h2>
            <dl className="mt-3 flex flex-col gap-2 text-sm">
              <Detail label="Name" value={booking.contact.name} />
              <Detail label="Email" value={booking.contact.email} />
              <Detail label="Phone" value={booking.contact.phone} />
            </dl>
          </section>

          {cancellable && (
            <CancelBookingButton
              bookingId={booking.id}
              bookingReference={booking.bookingReference}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-sand-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-sand-900">{value}</dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-sand-600">{label}</dt>
      <dd className="text-sand-900">{value}</dd>
    </div>
  );
}
