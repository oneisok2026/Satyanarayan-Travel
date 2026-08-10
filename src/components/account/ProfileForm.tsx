'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Input, Checkbox } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Alert';
import type { UserProfileDTO } from '@/types';

export function ProfileForm({ profile }: { profile: UserProfileDTO }) {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setSaved(false);
    setSaving(true);

    const data = new FormData(event.currentTarget);

    // Only the fields the schema accepts. Role and status are absent by
    // design — the server rejects them outright.
    const payload = {
      name: String(data.get('name') ?? ''),
      phone: String(data.get('phone') ?? ''),
      profile: {
        address: String(data.get('address') ?? ''),
        city: String(data.get('city') ?? ''),
        state: String(data.get('state') ?? ''),
        country: String(data.get('country') ?? ''),
        postalCode: String(data.get('postalCode') ?? ''),
      },
      preferences: {
        marketingEmails: data.get('marketingEmails') === 'on',
        whatsappUpdates: data.get('whatsappUpdates') === 'on',
      },
    };

    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok || !body?.success) {
        if (body?.error?.fields) setFieldErrors(body.error.fields);
        setError(body?.error?.message ?? 'Could not save your profile.');
        return;
      }

      setSaved(true);
      await refreshUser();
      // Server Components re-read the updated record.
      router.refresh();
    } catch {
      setError('Network problem. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  const firstError = (field: string) => fieldErrors[field]?.[0];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {error && <Alert variant="error">{error}</Alert>}
      {saved && <Alert variant="success">Your profile has been updated.</Alert>}

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 font-display text-lg font-semibold text-sand-900">
          Personal details
        </legend>

        <Input
          label="Full name"
          name="name"
          autoComplete="name"
          required
          defaultValue={profile.name}
          error={firstError('name')}
        />

        <Input
          label="Phone number"
          name="phone"
          type="tel"
          autoComplete="tel"
          defaultValue={profile.phone ?? ''}
          error={firstError('phone')}
          description="We use this to reach you about enquiries and bookings."
        />
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 font-display text-lg font-semibold text-sand-900">
          Address
        </legend>

        <Input
          label="Address"
          name="address"
          autoComplete="street-address"
          defaultValue={profile.profile.address ?? ''}
          error={firstError('profile.address')}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="City"
            name="city"
            autoComplete="address-level2"
            defaultValue={profile.profile.city ?? ''}
          />
          <Input
            label="State"
            name="state"
            autoComplete="address-level1"
            defaultValue={profile.profile.state ?? ''}
          />
          <Input
            label="Country"
            name="country"
            autoComplete="country-name"
            defaultValue={profile.profile.country ?? ''}
          />
          <Input
            label="Postal code"
            name="postalCode"
            autoComplete="postal-code"
            defaultValue={profile.profile.postalCode ?? ''}
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 font-display text-lg font-semibold text-sand-900">
          Communication
        </legend>

        <Checkbox
          name="marketingEmails"
          defaultChecked={profile.preferences.marketingEmails}
          label="Email me travel offers and seasonal packages"
        />
        <Checkbox
          name="whatsappUpdates"
          defaultChecked={profile.preferences.whatsappUpdates}
          label="Send me trip updates on WhatsApp"
        />
      </fieldset>

      <div className="flex justify-end">
        <Button type="submit" loading={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
