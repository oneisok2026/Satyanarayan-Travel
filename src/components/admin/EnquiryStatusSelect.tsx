'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { ENQUIRY_STATUSES, type EnquiryStatus } from '@/constants';

const LABELS: Record<EnquiryStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  follow_up: 'Follow up',
  quoted: 'Quoted',
  confirmed: 'Confirmed',
  closed: 'Closed',
};

/** Inline status change. The server re-verifies the admin role and audits it. */
export function EnquiryStatusSelect({
  enquiryId,
  status,
}: {
  enquiryId: string;
  status: EnquiryStatus;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [value, setValue] = useState<EnquiryStatus>(status);
  const [pending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);

  async function handleChange(next: EnquiryStatus) {
    const previous = value;
    setValue(next); // optimistic
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/enquiries/${enquiryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ status: next }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok || !body?.success) {
        setValue(previous); // roll back so the UI matches the database
        notify(body?.error?.message ?? 'Could not update the status.', 'error');
        return;
      }

      notify(`Marked as ${LABELS[next].toLowerCase()}.`);
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
      <label htmlFor={`status-${enquiryId}`} className="sr-only">
        Enquiry status
      </label>
      <select
        id={`status-${enquiryId}`}
        value={value}
        disabled={saving || pending}
        onChange={(event) => handleChange(event.target.value as EnquiryStatus)}
        className={cn(
          'h-8 rounded-lg border border-sand-300 bg-white px-2 text-xs',
          'text-sand-800 transition-colors hover:border-sand-400',
          'focus:border-brand-500 focus:ring-4 focus:ring-brand-500/12 focus:outline-none',
          'disabled:opacity-60',
          'select-chevron select-chevron-sm',
        )}
      >
        {ENQUIRY_STATUSES.map((option) => (
          <option key={option} value={option}>
            {LABELS[option]}
          </option>
        ))}
      </select>
    </>
  );
}
