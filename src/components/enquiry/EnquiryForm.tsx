'use client';

import { useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select, Checkbox, HoneypotField } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Alert';
import type { EnquiryType } from '@/constants';

interface EnquiryFormProps {
  type: EnquiryType;
  packageId?: string;
  destinationId?: string;
  serviceSlug?: string;
  /** Extra service-specific fields rendered above the message box. */
  extraFields?: { name: string; label: string; type?: string; options?: string[] }[];
  onSuccess?: () => void;
  compact?: boolean;
}

interface FieldErrors {
  [key: string]: string[];
}

/**
 * Shared enquiry form.
 *
 * Client-side validation is a convenience only — the server re-validates
 * everything, applies the rate limit and runs the spam checks. The honeypot
 * and the form-load timestamp feed the server's spam heuristics.
 */
export function EnquiryForm({
  type,
  packageId,
  destinationId,
  serviceSlug,
  extraFields = [],
  onSuccess,
  compact = false,
}: EnquiryFormProps) {
  // Captured on first render so the server can measure fill time.
  const formLoadedAt = useRef(Date.now());
  const formRef = useRef<HTMLFormElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);

    const data = new FormData(event.currentTarget);

    const serviceDetails: Record<string, string> = {};
    for (const field of extraFields) {
      const value = data.get(field.name);
      if (typeof value === 'string' && value) serviceDetails[field.name] = value;
    }

    const payload = {
      type,
      packageId,
      destinationId,
      serviceSlug,
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      phone: String(data.get('phone') ?? ''),
      travelDate: data.get('travelDate') || undefined,
      travellers: {
        adults: Number(data.get('adults') ?? 1),
        children: Number(data.get('children') ?? 0),
      },
      budget: data.get('budget') ? Number(data.get('budget')) : undefined,
      message: String(data.get('message') ?? '') || undefined,
      consent: data.get('consent') === 'on',
      website: String(data.get('website') ?? ''),
      formLoadedAt: formLoadedAt.current,
      ...(Object.keys(serviceDetails).length > 0 ? { serviceDetails } : {}),
    };

    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok || !body?.success) {
        if (body?.error?.fields) setFieldErrors(body.error.fields);
        setError(body?.error?.message ?? 'Could not send your enquiry. Please try again.');
        return;
      }

      setReference(body.data.enquiry.referenceCode);
      formRef.current?.reset();
      onSuccess?.();
    } catch {
      setError('Network problem. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (reference) {
    return (
      <Alert variant="success" title="Enquiry received">
        <p>
          Thank you — our team will be in touch within one working day. Your reference is{' '}
          <strong>{reference}</strong>.
        </p>
      </Alert>
    );
  }

  const firstError = (field: string) => fieldErrors[field]?.[0];

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {error && <Alert variant="error">{error}</Alert>}

      <HoneypotField />

      <div className={compact ? 'flex flex-col gap-4' : 'grid gap-4 sm:grid-cols-2'}>
        <Input
          label="Your name"
          name="name"
          autoComplete="name"
          required
          error={firstError('name')}
          placeholder="Full name"
        />
        <Input
          label="Phone number"
          name="phone"
          type="tel"
          autoComplete="tel"
          required
          error={firstError('phone')}
          placeholder="+91 98765 43210"
        />
      </div>

      <Input
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        required
        error={firstError('email')}
        placeholder="you@example.com"
      />

      {extraFields.length > 0 && (
        <div className={compact ? 'flex flex-col gap-4' : 'grid gap-4 sm:grid-cols-2'}>
          {extraFields.map((field) =>
            field.options ? (
              <Select
                key={field.name}
                label={field.label}
                name={field.name}
                placeholder="Please select"
                options={field.options.map((option) => ({
                  value: option,
                  label: option,
                }))}
              />
            ) : (
              <Input
                key={field.name}
                label={field.label}
                name={field.name}
                type={field.type ?? 'text'}
              />
            ),
          )}
        </div>
      )}

      {/* Single column until sm: three date/number inputs side by side have a
          min-content width wider than a phone viewport. */}
      <div className="grid gap-4 [&>*]:min-w-0 sm:grid-cols-3">
        <Input
          label="Travel date"
          name="travelDate"
          type="date"
          error={firstError('travelDate')}
          min={new Date().toISOString().slice(0, 10)}
        />
        <Input
          label="Adults"
          name="adults"
          type="number"
          min={1}
          max={60}
          defaultValue={2}
          error={firstError('travellers.adults')}
        />
        <Input
          label="Children"
          name="children"
          type="number"
          min={0}
          max={60}
          defaultValue={0}
        />
      </div>

      <Input
        label="Approximate budget"
        name="budget"
        type="number"
        min={0}
        description="Per person, in INR. Optional — it helps us suggest the right options."
        error={firstError('budget')}
        placeholder="30000"
      />

      <Textarea
        label="Anything else we should know?"
        name="message"
        rows={4}
        error={firstError('message')}
        placeholder="Preferred hotels, dietary requirements, celebrations, pace of travel…"
      />

      <Checkbox
        name="consent"
        required
        error={firstError('consent')}
        label={
          <>
            I agree to be contacted about this enquiry and accept the{' '}
            <a
              href="/privacy-policy"
              className="text-brand-700 underline underline-offset-4"
            >
              privacy policy
            </a>
            .
          </>
        }
      />

      <Button type="submit" size="lg" loading={submitting} fullWidth>
        {submitting ? 'Sending…' : 'Send enquiry'}
      </Button>

      <p className="text-center text-xs text-sand-500">
        We reply within one working day. No payment required to enquire.
      </p>
    </form>
  );
}
