'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

/**
 * Edit and delete for one gallery image.
 *
 * Deleting is confirmed rather than immediate: unlike the rest of the
 * catalogue there is no "hide instead" fallback worth offering here — a
 * gallery item is only its image — so the dialog says plainly that the file
 * goes too.
 */
export function GalleryItemActions({
  id,
  label,
}: {
  id: string;
  /** Caption or album, used to name the item in the confirm dialog. */
  label: string;
}) {
  const router = useRouter();
  const { notify } = useToast();

  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  async function handleDelete() {
    const response = await fetch(`/api/admin/catalogue/gallery/${id}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });

    const body = await response.json().catch(() => null);

    if (!response.ok || !body?.success) {
      // Thrown so the dialog shows the reason rather than closing as if it
      // had succeeded.
      throw new Error(body?.error?.message ?? 'Could not delete this image.');
    }

    notify(body.message ?? 'Image deleted.');
    startTransition(() => router.refresh());
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Link
          href={`/admin/gallery/${id}`}
          className="rounded-lg px-2 py-1 text-[0.6875rem] font-medium text-brand-700 transition-colors hover:bg-brand-50"
        >
          Edit
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg px-2 py-1 text-[0.6875rem] font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
        >
          Delete
        </button>
      </div>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleDelete}
        title="Delete this image?"
        confirmLabel="Delete permanently"
        destructive
        description={
          <>
            <strong>{label}</strong> will be removed from the gallery, and the
            uploaded file will be deleted from storage.
            <br />
            <br />
            This cannot be undone. To take it off the website but keep the
            image, edit it and set the status to <strong>Hidden</strong>{' '}
            instead.
          </>
        }
      />
    </>
  );
}
