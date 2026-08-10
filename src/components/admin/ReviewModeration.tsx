'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import type { ReviewStatus } from '@/constants';

/**
 * Approve / reject controls.
 *
 * Approving publishes the review and recalculates the package's public
 * rating, so both decisions are confirmed rather than one-click.
 */
export function ReviewModeration({
  reviewId,
  status,
}: {
  reviewId: string;
  status: ReviewStatus;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);
  const [, startTransition] = useTransition();

  async function apply() {
    if (!decision) return;

    const response = await fetch(`/api/admin/reviews/${reviewId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ status: decision }),
    });

    const body = await response.json().catch(() => null);
    if (!response.ok || !body?.success) {
      throw new Error(body?.error?.message ?? 'Could not moderate this review.');
    }

    notify(`Review ${decision}.`, decision === 'approved' ? 'success' : 'info');
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {status !== 'approved' && (
        <Button size="sm" onClick={() => setDecision('approved')}>
          Approve
        </Button>
      )}
      {status !== 'rejected' && (
        <Button size="sm" variant="outline" onClick={() => setDecision('rejected')}>
          Reject
        </Button>
      )}

      <ConfirmDialog
        open={decision !== null}
        onClose={() => setDecision(null)}
        onConfirm={apply}
        title={decision === 'approved' ? 'Publish this review?' : 'Reject this review?'}
        confirmLabel={decision === 'approved' ? 'Approve' : 'Reject'}
        destructive={decision === 'rejected'}
        description={
          decision === 'approved' ? (
            'It will appear on the package page and count toward the public rating.'
          ) : (
            'It stays hidden from the public and is excluded from the rating.'
          )
        }
      />
    </div>
  );
}
