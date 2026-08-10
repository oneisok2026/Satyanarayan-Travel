'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { ContentStatus } from '@/constants';

interface CatalogueRowActionsProps {
  resource: string;
  id: string;
  title: string;
  status: ContentStatus;
  /** Only super admins may edit content or delete. */
  canManage: boolean;
  /** Omitted for resources without an edit form yet. */
  editHref?: string;
}

/**
 * Per-row status toggle plus edit and delete.
 *
 * "Hide" writes `archived` rather than deleting: the record keeps its slug,
 * history and any bookings referencing it, and vanishes from the public site
 * because every public query pins `status: 'published'`.
 */
export function CatalogueRowActions({
  resource,
  id,
  title,
  status,
  canManage,
  editHref,
}: CatalogueRowActionsProps) {
  const router = useRouter();
  const { notify } = useToast();

  const [value, setValue] = useState<ContentStatus>(status);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [, startTransition] = useTransition();

  async function handleStatus(next: ContentStatus) {
    const previous = value;
    setValue(next); // optimistic
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/catalogue/${resource}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ status: next }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok || !body?.success) {
        setValue(previous); // roll back so the control matches the database
        notify(body?.error?.message ?? 'Could not change the status.', 'error');
        return;
      }

      notify(body.message ?? 'Status updated.');
      startTransition(() => router.refresh());
    } catch {
      setValue(previous);
      notify('Network problem. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const response = await fetch(`/api/admin/catalogue/${resource}/${id}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });

    const body = await response.json().catch(() => null);

    if (!response.ok || !body?.success) {
      // Thrown so the dialog shows the reason — commonly that live bookings
      // reference this record — rather than closing as if it succeeded.
      throw new Error(body?.error?.message ?? 'Could not delete this entry.');
    }

    notify(body.message ?? 'Deleted.');
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <label htmlFor={`status-${resource}-${id}`} className="sr-only">
        Visibility for {title}
      </label>
      <select
        id={`status-${resource}-${id}`}
        value={value}
        disabled={saving}
        onChange={(event) => handleStatus(event.target.value as ContentStatus)}
        className={cn(
          'h-8 rounded-lg border px-2 pr-7 text-xs font-medium transition-colors',
          'focus:border-brand-500 focus:ring-4 focus:ring-brand-500/12 focus:outline-none',
          'disabled:opacity-60',
          value === 'published'
            ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
            : 'border-sand-300 bg-sand-50 text-sand-700',
          "appearance-none bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23807d78' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")] bg-[length:0.75rem] bg-[position:right_0.5rem_center] bg-no-repeat",
        )}
      >
        <option value="published">Published</option>
        <option value="archived">Hidden</option>
        <option value="draft">Draft</option>
      </select>

      {canManage && editHref && (
        <Link
          href={editHref}
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-50"
        >
          Edit
        </Link>
      )}

      {canManage && (
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-[--color-danger] transition-colors hover:bg-red-50"
        >
          Delete
        </button>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete permanently?"
        confirmLabel="Delete permanently"
        destructive
        description={
          <>
            <strong>{title}</strong> will be removed from the database and
            cannot be recovered.
            <br />
            <br />
            If you only want it off the website, close this and set the status
            to <strong>Hidden</strong> instead — that keeps the record and any
            bookings attached to it.
          </>
        }
      />
    </div>
  );
}
