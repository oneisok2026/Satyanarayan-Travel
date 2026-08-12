'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

/**
 * Permanent removal of a single booking, super_admin only.
 *
 * Rendered only for super admins, and the API re-checks the role — the button
 * being absent is a convenience, not the control. Distinct from cancelling,
 * which keeps the record; this is for clearing test entries and spam, so the
 * dialog is explicit that nothing can be recovered.
 */
export function BookingDeleteButton({
  bookingId,
  bookingReference,
  customerName,
}: {
  bookingId: string;
  bookingReference: string;
  customerName: string;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  async function handleDelete() {
    const response = await fetch(`/api/admin/bookings/${bookingId}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });

    const body = await response.json().catch(() => null);

    if (!response.ok || !body?.success) {
      // Thrown so the dialog surfaces the reason instead of closing as
      // though the delete had succeeded.
      throw new Error(body?.error?.message ?? 'Could not delete this booking.');
    }

    notify(body.message ?? 'Booking deleted.');
    startTransition(() => router.refresh());
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Delete booking ${bookingReference}`}
        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
      >
        Delete
      </button>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleDelete}
        title="Delete this booking?"
        confirmLabel="Delete permanently"
        destructive
        description={
          <>
            Booking <strong>{bookingReference}</strong> from{' '}
            <strong>{customerName}</strong> will be removed from the database.
            This cannot be undone.
            <br />
            <br />
            To keep the record but take it out of your active list, close this
            and set the status to <strong>Cancelled</strong> instead.
          </>
        }
      />
    </>
  );
}
