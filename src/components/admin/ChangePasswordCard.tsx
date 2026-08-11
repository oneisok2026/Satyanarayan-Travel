'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/components/ui/Toast';

/**
 * Password change for the signed-in admin.
 *
 * The credential never reaches this application: both the reauthentication
 * and the update are Firebase calls made from the browser. The server is not
 * involved beyond re-issuing the session cookie afterwards.
 *
 * Requiring the current password is the point of the form. Firebase would
 * accept `updatePassword` on a recently-signed-in user without it, which
 * means an unattended, unlocked browser is enough to seize the account — so
 * the current password is proved explicitly instead.
 */

const MIN_PASSWORD_LENGTH = 8;

const EMPTY = { current: '', next: '', confirm: '' };

export function ChangePasswordCard({ email }: { email: string }) {
  const { changePassword, configured } = useAuth();
  const { notify } = useToast();

  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update(key: keyof typeof EMPTY, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: '' }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const errors: Record<string, string> = {};
    if (!form.current) errors.current = 'Enter your current password.';
    if (form.next.length < MIN_PASSWORD_LENGTH) {
      errors.next = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (form.next && form.next === form.current) {
      errors.next = 'Choose a password different from your current one.';
    }
    if (form.next !== form.confirm) {
      errors.confirm = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSaving(true);

    try {
      await changePassword(form.current, form.next);
      setForm(EMPTY);
      notify('Password updated.');
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Could not change your password.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="ring-sand-200 rounded-2xl bg-white p-6 ring-1">
      <h2 className="font-display text-sand-900 text-lg font-semibold">Password</h2>
      <p className="text-sand-600 mt-1 text-sm">
        Change the password for <span className="font-medium">{email}</span>.
      </p>

      {!configured ? (
        <Alert variant="warning" className="mt-4">
          Authentication is not configured, so the password cannot be changed here.
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4" noValidate>
          {error && <Alert variant="error">{error}</Alert>}

          {/* Helps password managers associate the entry with this account. */}
          <input
            type="text"
            name="username"
            autoComplete="username"
            value={email}
            readOnly
            hidden
          />

          <PasswordInput
            label="Current password"
            name="currentPassword"
            autoComplete="current-password"
            required
            value={form.current}
            error={fieldErrors.current}
            onChange={(event) => update('current', event.target.value)}
            wrapperClassName="max-w-md"
          />

          <PasswordInput
            label="New password"
            name="newPassword"
            autoComplete="new-password"
            required
            value={form.next}
            error={fieldErrors.next}
            description={`At least ${MIN_PASSWORD_LENGTH} characters.`}
            onChange={(event) => update('next', event.target.value)}
            wrapperClassName="max-w-md"
          />

          <PasswordInput
            label="Confirm new password"
            name="confirmPassword"
            autoComplete="new-password"
            required
            value={form.confirm}
            error={fieldErrors.confirm}
            onChange={(event) => update('confirm', event.target.value)}
            wrapperClassName="max-w-md"
          />

          <div>
            <Button type="submit" loading={saving}>
              {saving ? 'Updating…' : 'Update password'}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
