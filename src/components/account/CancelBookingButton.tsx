'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface CancelBookingButtonProps {
  bookingId: string;
  bookingReference: string;
}

/** Customer-initiated cancellation, only offered before confirmation. */
export function CancelBookingButton({
  bookingId,
  bookingReference,
}: CancelBookingButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleCancel() {
    const response = await fetch(`/api/bookings/${bookingId}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });

    const body = await response.json().catch(() => null);

    if (!response.ok || !body?.success) {
      // Thrown so the dialog shows the error instead of closing, which would
      // read as a successful cancellation.
      throw new Error(
        body?.error?.message ?? 'Could not cancel this booking. Please contact us.',
      );
    }

    router.refresh();
  }

  return (
    <>
      <div className="rounded-2xl bg-sand-100 p-5">
        <h2 className="text-sm font-semibold text-sand-900">Need to cancel?</h2>
        <p className="mt-1 text-sm leading-relaxed text-sand-600">
          You can cancel online while this booking is still awaiting
          confirmation. After that, please contact us directly.
        </p>
        <Button
          variant="outline"
          size="sm"
          fullWidth
          className="mt-3"
          onClick={() => setOpen(true)}
        >
          Cancel booking
        </Button>
      </div>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleCancel}
        title="Cancel this booking?"
        confirmLabel="Yes, cancel it"
        cancelLabel="Keep booking"
        destructive
        description={
          <>
            Booking <strong>{bookingReference}</strong> will be cancelled. This
            cannot be undone — you would need to book again.
          </>
        }
      />
    </>
  );
}
