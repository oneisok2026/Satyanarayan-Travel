'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatPrice } from '@/lib/utils';
import type { EnquiryDTO } from '@/types';

/**
 * Full enquiry detail.
 *
 * The listing truncates to keep rows scannable, so the message — the part an
 * admin actually needs to answer — is only fully readable here. Everything
 * shown is already in the row's DTO, so opening the dialog costs no request.
 */

const TYPE_LABELS: Record<string, string> = {
  general: 'General',
  package: 'Package',
  hotel: 'Hotel',
  car_rental: 'Car rental',
  eticket: 'E-ticket',
  bus_rental: 'Car/Bus rental',
  railway: 'Railway ticket',
  flight: 'Flight ticket',
  contact: 'Contact',
};

export function EnquiryViewButton({ enquiry }: { enquiry: EnquiryDTO }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  /**
   * Opening the dialog is what marks the enquiry read, which is what clears
   * the notification badge. Fire-and-forget: the admin is already reading it,
   * so a failed request must not block or interrupt that. It stays unread and
   * the next open retries.
   */
  function handleOpen() {
    setOpen(true);

    if (enquiry.readAt) return;

    void fetch(`/api/admin/enquiries/${enquiry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ read: true }),
    })
      .then((response) => {
        // Refresh so the bell's count reflects the change on this page too.
        if (response.ok) startTransition(() => router.refresh());
      })
      .catch(() => undefined);
  }

  const travellers =
    enquiry.travellers.adults + enquiry.travellers.children > 0
      ? `${enquiry.travellers.adults} adult${enquiry.travellers.adults === 1 ? '' : 's'}` +
        (enquiry.travellers.children > 0
          ? `, ${enquiry.travellers.children} child${enquiry.travellers.children === 1 ? '' : 'ren'}`
          : '')
      : null;

  const interest =
    enquiry.packageRef?.title ??
    enquiry.destinationRef?.name ??
    enquiry.serviceSlug ??
    TYPE_LABELS[enquiry.type] ??
    enquiry.type;

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-50"
      >
        View
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={enquiry.name}
        description={`${TYPE_LABELS[enquiry.type] ?? enquiry.type} enquiry · ${enquiry.referenceCode}`}
        size="lg"
      >
        <div className="flex flex-col gap-5">
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <Detail label="Email">
              <a
                href={`mailto:${enquiry.email}`}
                className="break-all text-brand-700 underline-offset-4 hover:underline"
              >
                {enquiry.email}
              </a>
            </Detail>

            <Detail label="Phone">
              <a
                href={`tel:${enquiry.phone}`}
                className="text-brand-700 underline-offset-4 hover:underline"
              >
                {enquiry.phone}
              </a>
            </Detail>

            <Detail label="Interest">{interest}</Detail>
            <Detail label="Received">{formatDate(enquiry.createdAt)}</Detail>

            {enquiry.travelDate && (
              <Detail label="Travel date">{formatDate(enquiry.travelDate)}</Detail>
            )}
            {travellers && <Detail label="Travellers">{travellers}</Detail>}
            {enquiry.budget != null && (
              <Detail label="Budget">{formatPrice(enquiry.budget)}</Detail>
            )}
          </dl>

          <div>
            <h3 className="text-xs font-semibold tracking-wide text-sand-500 uppercase">
              Message
            </h3>
            {enquiry.message ? (
              // Customer-authored text: rendered as plain text and wrapped, so
              // long words and pasted line breaks cannot break the layout.
              <p className="mt-2 rounded-xl bg-sand-50 p-4 text-sm leading-relaxed break-words whitespace-pre-wrap text-sand-800">
                {enquiry.message}
              </p>
            ) : (
              <p className="mt-2 text-sm text-sand-500">No message was left.</p>
            )}
          </div>

          {enquiry.serviceDetails &&
            Object.keys(enquiry.serviceDetails).length > 0 && (
              <div>
                <h3 className="text-xs font-semibold tracking-wide text-sand-500 uppercase">
                  Service details
                </h3>
                <dl className="mt-2 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                  {Object.entries(enquiry.serviceDetails).map(([key, value]) => (
                    <Detail key={key} label={humanise(key)}>
                      {String(value)}
                    </Detail>
                  ))}
                </dl>
              </div>
            )}

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wide text-sand-500 uppercase">
              Status
            </span>
            <Badge tone="neutral">{humanise(enquiry.status)}</Badge>
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

/** "follow_up" → "Follow up", "pickupCity" → "Pickup city". */
function humanise(value: string): string {
  const spaced = value.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}
