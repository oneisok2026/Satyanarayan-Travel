'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface PriceMessageCardProps {
  /** The setting's key, passed through to the API. */
  settingKey: string;
  /** The stored wording, or '' when the default is in use. */
  initialValue: string;
  /** Shown when nothing is stored, and restored by "Reset". */
  fallback: string;
}

/**
 * Editor for the message shown where a package price is hidden.
 *
 * Add, update and delete are the same one-field write: saving text sets it,
 * and resetting clears the stored value so the built-in wording applies again.
 * The message can never be blank on the website, because a package with its
 * price hidden and no wording would render an empty gap.
 */
export function PriceMessageCard({
  settingKey,
  initialValue,
  fallback,
}: PriceMessageCardProps) {
  const router = useRouter();
  const { notify } = useToast();

  const [value, setValue] = useState(initialValue);
  const [saved, setSaved] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const dirty = value.trim() !== saved;

  /** Writes the value, returning null on success or the reason on failure. */
  async function write(next: string): Promise<string | null> {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ key: settingKey, value: next }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok || !body?.success) {
        const message = body?.error?.message ?? 'Could not save the message.';
        setError(message);
        return message;
      }

      setSaved(next);
      setValue(next);
      notify(body.message ?? 'Saved.');
      router.refresh();
      return null;
    } catch {
      const message = 'Network problem. Please try again.';
      setError(message);
      return message;
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const next = value.trim();
    if (!next) {
      setError('Enter a message, or use Reset to restore the default wording.');
      return;
    }

    await write(next);
  }

  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-sand-200 sm:p-6">
      <h2 className="font-display text-base font-semibold text-sand-900 sm:text-lg">
        Price enquiry message
      </h2>
      <p className="mt-1.5 text-sm text-sand-600">
        Shown in place of the price on any package where{' '}
        <strong className="font-medium text-sand-800">
          Hide the price on the website
        </strong>{' '}
        is ticked. Also used on the services pages.
      </p>

      <form onSubmit={handleSubmit} className="mt-5">
        <Input
          label="Message"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          error={error ?? undefined}
          maxLength={120}
          placeholder={fallback}
          description={
            saved
              ? 'Leave it as it is, or edit and save to change the wording everywhere.'
              : `Nothing saved yet, so the website is showing "${fallback}".`
          }
        />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button type="submit" loading={saving} disabled={!dirty || saving}>
            {saved ? 'Save changes' : 'Save message'}
          </Button>

          {saved && (
            <button
              type="button"
              onClick={() => setResetOpen(true)}
              disabled={saving}
              className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
            >
              Reset to default
            </button>
          )}

          {dirty && !saving && (
            <span className="text-xs text-sand-500">Unsaved changes</span>
          )}
        </div>
      </form>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={async () => {
          // Thrown so the dialog shows the reason rather than closing as if
          // the reset had succeeded.
          const failure = await write('');
          if (failure) throw new Error(failure);
        }}
        title="Reset the message?"
        confirmLabel="Reset to default"
        destructive
        description={
          <>
            Your wording will be removed and the website will show{' '}
            <strong>{fallback}</strong> again.
          </>
        }
      />
    </section>
  );
}
