'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  BOOKING_STATUSES,
  PAYMENT_STATUSES,
  type BookingStatus,
  type PaymentStatus,
} from '@/constants';

const label = (value: string) =>
  value.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase());

const selectClass = cn(
  'h-8 w-full rounded-lg border border-sand-300 bg-white px-2 text-xs',
  'text-sand-800 transition-colors hover:border-sand-400',
  'focus:border-brand-500 focus:ring-4 focus:ring-brand-500/12 focus:outline-none',
  'disabled:opacity-60',
  'select-chevron select-chevron-sm',
);

interface Props {
  bookingId: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
}

/**
 * Booking and payment status controls.
 *
 * Marking a booking paid is confirmed explicitly: it is the field that
 * records money as received, so it should never change on a stray click.
 */
export function BookingStatusControls({ bookingId, status, paymentStatus }: Props) {
  const router = useRouter();
  const { notify } = useToast();

  const [bookingValue, setBookingValue] = useState(status);
  const [paymentValue, setPaymentValue] = useState(paymentStatus);
  const [pendingPayment, setPendingPayment] = useState<PaymentStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  async function patch(payload: Record<string, string>): Promise<boolean> {
    const response = await fetch(`/api/admin/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    });

    const body = await response.json().catch(() => null);

    if (!response.ok || !body?.success) {
      throw new Error(body?.error?.message ?? 'Could not update this booking.');
    }
    return true;
  }

  async function handleBookingStatus(next: BookingStatus) {
    const previous = bookingValue;
    setBookingValue(next);
    setSaving(true);
    try {
      await patch({ status: next });
      notify(`Booking marked ${label(next).toLowerCase()}.`);
      startTransition(() => router.refresh());
    } catch (error) {
      // The server enforces a transition table, so an invalid change is
      // rejected — roll the select back to match.
      setBookingValue(previous);
      notify(error instanceof Error ? error.message : 'Update failed.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function confirmPayment() {
    if (!pendingPayment) return;
    const previous = paymentValue;
    try {
      await patch({ paymentStatus: pendingPayment });
      setPaymentValue(pendingPayment);
      notify(`Payment marked ${label(pendingPayment).toLowerCase()}.`);
      startTransition(() => router.refresh());
    } catch (error) {
      setPaymentValue(previous);
      throw error; // surfaced inside the dialog
    }
  }

  return (
    <div className="flex min-w-40 flex-col gap-1.5">
      <label htmlFor={`booking-status-${bookingId}`} className="sr-only">
        Booking status
      </label>
      <select
        id={`booking-status-${bookingId}`}
        value={bookingValue}
        disabled={saving}
        onChange={(event) => handleBookingStatus(event.target.value as BookingStatus)}
        className={selectClass}
      >
        {BOOKING_STATUSES.map((option) => (
          <option key={option} value={option}>
            {label(option)}
          </option>
        ))}
      </select>

      <label htmlFor={`payment-status-${bookingId}`} className="sr-only">
        Payment status
      </label>
      <select
        id={`payment-status-${bookingId}`}
        value={paymentValue}
        disabled={saving}
        onChange={(event) =>
          setPendingPayment(event.target.value as PaymentStatus)
        }
        className={selectClass}
      >
        {PAYMENT_STATUSES.map((option) => (
          <option key={option} value={option}>
            {label(option)}
          </option>
        ))}
      </select>

      <ConfirmDialog
        open={pendingPayment !== null}
        onClose={() => setPendingPayment(null)}
        onConfirm={confirmPayment}
        title="Change payment status?"
        confirmLabel="Yes, update"
        description={
          <>
            This records the payment as{' '}
            <strong>{pendingPayment ? label(pendingPayment).toLowerCase() : ''}</strong>.
            The change is written to the audit log.
          </>
        }
      />
    </div>
  );
}
