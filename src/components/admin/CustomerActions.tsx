'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { USER_ROLES, type UserRole } from '@/constants';

interface CustomerActionsProps {
  customerId: string;
  name: string;
  role: string;
  status: string;
  isSelf: boolean;
  canChangeRole: boolean;
}

const label = (value: string) =>
  value.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase());

/**
 * Role and suspension controls.
 *
 * Both are also enforced server-side: role changes require super_admin, and
 * self-targeting is refused. Hiding controls here is convenience, not
 * security.
 */
export function CustomerActions({
  customerId,
  name,
  role,
  status,
  isSelf,
  canChangeRole,
}: CustomerActionsProps) {
  const router = useRouter();
  const { notify } = useToast();
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [, startTransition] = useTransition();

  const suspended = status !== 'active';

  async function patch(payload: Record<string, string>) {
    const response = await fetch(`/api/admin/customers/${customerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    });

    const body = await response.json().catch(() => null);
    if (!response.ok || !body?.success) {
      throw new Error(body?.error?.message ?? 'That change could not be applied.');
    }
  }

  if (isSelf) {
    return <span className="text-xs text-sand-400">Your account</span>;
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {canChangeRole && (
        <>
          <label htmlFor={`role-${customerId}`} className="sr-only">
            Role for {name}
          </label>
          <select
            id={`role-${customerId}`}
            value={role}
            onChange={(event) => setPendingRole(event.target.value as UserRole)}
            className={cn(
              'h-8 rounded-lg border border-sand-300 bg-white px-2 text-xs',
              'text-sand-800 transition-colors hover:border-sand-400',
              'focus:border-brand-500 focus:ring-4 focus:ring-brand-500/12 focus:outline-none',
              'select-chevron select-chevron-sm',
            )}
          >
            {USER_ROLES.map((option) => (
              <option key={option} value={option}>
                {label(option)}
              </option>
            ))}
          </select>
        </>
      )}

      <Button
        size="sm"
        variant={suspended ? 'outline' : 'danger'}
        onClick={() => setSuspendOpen(true)}
      >
        {suspended ? 'Reactivate' : 'Suspend'}
      </Button>

      <ConfirmDialog
        open={pendingRole !== null}
        onClose={() => setPendingRole(null)}
        onConfirm={async () => {
          if (!pendingRole) return;
          await patch({ role: pendingRole });
          notify(`${name} is now ${label(pendingRole).toLowerCase()}.`);
          startTransition(() => router.refresh());
        }}
        title="Change this role?"
        confirmLabel="Change role"
        description={
          <>
            <strong>{name}</strong> will become{' '}
            <strong>{pendingRole ? label(pendingRole).toLowerCase() : ''}</strong>.
            Admin roles grant access to every enquiry, booking and customer
            record. This is written to the audit log.
          </>
        }
      />

      <ConfirmDialog
        open={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        onConfirm={async () => {
          await patch({ status: suspended ? 'active' : 'suspended' });
          notify(
            suspended ? `${name} reactivated.` : `${name} suspended.`,
            suspended ? 'success' : 'info',
          );
          startTransition(() => router.refresh());
        }}
        title={suspended ? 'Reactivate this account?' : 'Suspend this account?'}
        confirmLabel={suspended ? 'Reactivate' : 'Suspend'}
        destructive={!suspended}
        description={
          suspended ? (
            <>
              <strong>{name}</strong> will be able to sign in again.
            </>
          ) : (
            <>
              <strong>{name}</strong> will be signed out everywhere immediately
              and blocked from signing in. Their bookings and enquiries are kept.
            </>
          )
        }
      />
    </div>
  );
}
