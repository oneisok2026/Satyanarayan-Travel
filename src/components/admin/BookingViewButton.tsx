'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatPrice } from '@/lib/utils';
import type { BookingDTO } from '@/types';

/**
 * Full booking detail.
 *
 * The listing truncates to keep rows scannable, so the notes — the part an
 * admin actually needs before calling the customer — are only fully readable
 * here. Everything shown is already in the row's DTO, so opening the dialog
 * costs no request.
 */
export function BookingViewButton({ booking }: { booking: BookingDTO }) {
  const [open, setOpen] = useState(false);

  const { pricingSnapshot: price } = booking;
  const travellers =
    `${price.adults} adult${price.adults === 1 ? '' : 's'}` +
    (price.children > 0
      ? `, ${price.children} child${price.children === 1 ? '' : 'ren'}`
      : '');

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-50"
      >
        View
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={booking.contact.name}
        description={`Booking · ${booking.bookingReference}`}
        size="lg"
      >
        <div className="flex flex-col gap-5">
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <Detail label="Email">
              <a
                href={`mailto:${booking.contact.email}`}
                className="break-all text-brand-700 underline-offset-4 hover:underline"
              >
                {booking.contact.email}
              </a>
            </Detail>

            <Detail label="Phone">
              <a
                href={`tel:${booking.contact.phone}`}
                className="text-brand-700 underline-offset-4 hover:underline"
              >
                {booking.contact.phone}
              </a>
            </Detail>

            <Detail label="Package">{booking.packageRef.title}</Detail>
            <Detail label="Travel date">{formatDate(booking.travelDate)}</Detail>
            <Detail label="Travellers">{travellers}</Detail>
            <Detail label="Requested">{formatDate(booking.createdAt)}</Detail>
          </dl>

          <div className="rounded-xl bg-sand-50 p-4">
            <h3 className="text-xs font-semibold tracking-wide text-sand-500 uppercase">
              Pricing
            </h3>
            <dl className="mt-2.5 flex flex-col gap-1.5 text-sm">
              <Row
                label={`Adults × ${price.adults}`}
                value={formatPrice(price.unitPrice * price.adults)}
              />
              {price.children > 0 && (
                <Row
                  label={`Children × ${price.children}`}
                  value={formatPrice(price.childPrice * price.children)}
                />
              )}
              {/* Bookings taken before tax was dropped carry a stored GST
                  amount. Hiding it would leave the lines not adding up to the
                  total, so it is shown for those and absent for new ones. */}
              {price.taxes > 0 && (
                <Row label="Taxes" value={formatPrice(price.taxes)} />
              )}
              <div className="mt-1.5 flex justify-between border-t border-sand-200 pt-2 font-medium text-sand-900">
                <dt>Total</dt>
                <dd>{formatPrice(price.total)}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-wide text-sand-500 uppercase">
              Notes
            </h3>
            {booking.notes ? (
              // Customer-authored text: rendered as plain text and wrapped, so
              // long words and pasted line breaks cannot break the layout.
              <p className="mt-2 rounded-xl bg-sand-50 p-4 text-sm leading-relaxed break-words whitespace-pre-wrap text-sand-800">
                {booking.notes}
              </p>
            ) : (
              <p className="mt-2 text-sm text-sand-500">No notes were left.</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wide text-sand-500 uppercase">
              Status
            </span>
            <Badge tone="neutral">{humanise(booking.status)}</Badge>
          </div>
        </div>
      </Modal>
    </>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold tracking-wide text-sand-500 uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm break-words text-sand-800">{children}</dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sand-700">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

/** "pending_confirmation" → "Pending confirmation". */
function humanise(value: string): string {
  const spaced = value.replace(/[_-]+/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}
