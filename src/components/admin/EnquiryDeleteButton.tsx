'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

/**
 * Permanent removal of a single enquiry, super_admin only.
 *
 * Rendered only for super admins, and the API re-checks the role — the button
 * being absent is a convenience, not the control. There is no archived state
 * to fall back on here as there is for catalogue records, so the dialog is
 * explicit that the enquiry cannot be recovered.
 */
export function EnquiryDeleteButton({
  enquiryId,
  referenceCode,
  customerName,
}: {
  enquiryId: string;
  referenceCode: string;
  customerName: string;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  async function handleDelete() {
    const response = await fetch(`/api/admin/enquiries/${enquiryId}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });

    const body = await response.json().catch(() => null);

    if (!response.ok || !body?.success) {
      // Thrown so the dialog surfaces the reason instead of closing as
      // though the delete had succeeded.
      throw new Error(body?.error?.message ?? 'Could not delete this enquiry.');
    }

    notify(body.message ?? 'Enquiry deleted.');
    startTransition(() => router.refresh());
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Delete enquiry ${referenceCode}`}
        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
      >
        Delete
      </button>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleDelete}
        title="Delete this enquiry?"
        confirmLabel="Delete permanently"
        destructive
        description={
          <>
            The enquiry <strong>{referenceCode}</strong> from{' '}
            <strong>{customerName}</strong> will be removed from the database,
            along with any internal notes on it. This cannot be undone.
            <br />
            <br />
            To keep the record but take it out of your active list, close this
            and set the status to <strong>Closed</strong> instead.
          </>
        }
      />
    </>
  );
}
