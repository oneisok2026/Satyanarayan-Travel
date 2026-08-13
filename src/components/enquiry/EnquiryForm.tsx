'use client';

import { useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select, Checkbox, HoneypotField } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Alert';
import { buildGmailComposeUrl, openComposeWindow } from '@/lib/utils';
import { CONTACT } from '@/constants/navigation';
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

/** Human labels for the enquiry types, used in the email subject. */
const TYPE_LABELS: Record<string, string> = {
  contact: 'General enquiry',
  package: 'Tour package enquiry',
  destination: 'Destination enquiry',
  hotel: 'Hotel booking enquiry',
  car_rental: 'Car rental enquiry',
  eticket: 'E-ticket booking enquiry',
};

/**
 * Composes the mailto: message.
 *
 * The same details the server stored, written as plain text so the agency
 * receives a readable enquiry in their inbox even when the visitor's mail
 * client strips formatting.
 */
function composeEmail(
  fields: Record<string, string>,
  extraFields: { name: string; label: string }[],
  reference: string,
  type: EnquiryType,
): { subject: string; body: string } {
  const lines: string[] = [
    `Reference: ${reference}`,
    '',
    `Name: ${fields.name}`,
    `Phone: ${fields.phone}`,
    `Email: ${fields.email}`,
  ];

  if (fields.travelDate) lines.push(`Travel date: ${fields.travelDate}`);

  const adults = Number(fields.adults || 0);
  const children = Number(fields.children || 0);
  if (adults || children) {
    lines.push(`Travellers: ${adults} adult(s)${children ? `, ${children} child(ren)` : ''}`);
  }

  if (fields.budget) lines.push(`Approximate budget: INR ${fields.budget} per person`);

  for (const field of extraFields) {
    if (fields[field.name]) lines.push(`${field.label}: ${fields[field.name]}`);
  }

  if (fields.message) lines.push('', 'Message:', fields.message);

  return {
    subject: `${TYPE_LABELS[type] ?? 'Enquiry'} — ${fields.name} (${reference})`,
    body: lines.join('\n'),
  };
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
  /** Kept so the success panel can re-open the draft if the tab was blocked. */
  const [composeUrl, setComposeUrl] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);

    const data = new FormData(event.currentTarget);

    // Claimed synchronously inside the submit gesture: a browser only trusts
    // window.open while it is still handling the user's click, so the tab is
    // opened now and pointed at Gmail once the enquiry is saved. "noopener"
    // is deliberately omitted — it nulls the returned handle, and the tab
    // starts blank on our own origin rather than on the destination.
    const composeTab = window.open('', '_blank');
    // The blank tab can still reach back through window.opener until it is
    // navigated, so the link is severed immediately.
    if (composeTab) composeTab.opener = null;

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
        // Nothing was saved, so the waiting tab has no draft to show.
        composeTab?.close();
        return;
      }

      const referenceCode = body.data.enquiry.referenceCode as string;

      // The enquiry is already saved; this hands the visitor a prefilled
      // Gmail draft addressed to the agency, the browser-side counterpart of
      // the WhatsApp button.
      const { subject, body: emailBody } = composeEmail(
        Object.fromEntries(
          [...data.entries()].map(([key, entry]) => [key, String(entry)]),
        ),
        extraFields,
        referenceCode,
        type,
      );

      const url = buildGmailComposeUrl(CONTACT.email, subject, emailBody);
      setComposeUrl(url);
      setReference(referenceCode);
      formRef.current?.reset();
      onSuccess?.();

      // Hands off to the tab opened synchronously on submit, or to the mail
      // client directly on mobile. Opening a tab here instead would be after
      // an await, which popup blockers treat as untrusted and reject.
      openComposeWindow(url, composeTab);
    } catch {
      setError('Network problem. Please check your connection and try again.');
      composeTab?.close();
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
        {composeUrl && (
          <p className="mt-2">
            {/* On mobile the hand-off is a mailto:, which opens the phone's own
                mail app rather than a tab — so the copy and the link target
                both follow whichever URL was actually built. */}
            {composeUrl.startsWith('mailto:')
              ? 'Your mail app should have opened with the details ready to send. '
              : 'A Gmail tab should have opened with the details ready to send. '}
            <a
              href={composeUrl}
              {...(composeUrl.startsWith('mailto:')
                ? {}
                : { target: '_blank', rel: 'noopener noreferrer' })}
              className="font-medium underline underline-offset-4"
            >
              Open it again
            </a>{' '}
            if it did not.
          </p>
        )}
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
