'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { BOOKING_STATUSES, type BookingStatus } from '@/constants';

const label = (value: string) =>
  value.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase());

interface Props {
  bookingId: string;
  status: BookingStatus;
}

/**
 * Booking status control.
 *
 * Payment status is deliberately not editable here: bookings are settled with
 * the agency directly rather than through the site, so a payment field on this
 * row was a control nobody used and a number that could contradict reality.
 */
export function BookingStatusControls({ bookingId, status }: Props) {
  const router = useRouter();
  const { notify } = useToast();

  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  async function handleChange(next: BookingStatus) {
    const previous = value;
    setValue(next);
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ status: next }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok || !body?.success) {
        // The server enforces a transition table, so an invalid change is
        // rejected — roll the select back to match the database.
        setValue(previous);
        notify(body?.error?.message ?? 'Could not update this booking.', 'error');
        return;
      }

      notify(`Booking marked ${label(next).toLowerCase()}.`);
      startTransition(() => router.refresh());
    } catch {
      setValue(previous);
      notify('Network problem. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <label htmlFor={`booking-status-${bookingId}`} className="sr-only">
        Booking status
      </label>
      <select
        id={`booking-status-${bookingId}`}
        value={value}
        disabled={saving}
        onChange={(event) => handleChange(event.target.value as BookingStatus)}
        className={cn(
          'h-8 rounded-lg border border-sand-300 bg-white px-2 text-xs',
          'text-sand-800 transition-colors hover:border-sand-400',
          'focus:border-brand-500 focus:ring-4 focus:ring-brand-500/12 focus:outline-none',
          'disabled:opacity-60',
          'select-chevron select-chevron-sm',
        )}
      >
        {BOOKING_STATUSES.map((option) => (
          <option key={option} value={option}>
            {label(option)}
          </option>
        ))}
      </select>
    </>
  );
}
