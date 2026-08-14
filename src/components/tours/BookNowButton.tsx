'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Alert';
import { cn, formatPrice, buildGmailComposeUrl, openComposeWindow } from '@/lib/utils';
import { clientEnv } from '@/lib/env';

interface BookNowButtonProps {
  packageId: string;
  packageTitle: string;
  price: number;
  /** Hides the figure in the dialog, showing the enquiry message instead. */
  priceOnRequest?: boolean;
  /** Wording shown in place of the price. */
  priceMessage?: string;
  /** Where the composed booking request is addressed. */
  recipientEmail?: string;
  className?: string;
}

/**
 * Matches the server's cap: createBookingSchema rejects more than 30
 * travellers and tells the visitor to contact the agency directly, so the
 * form must not accept a party it knows will be refused.
 */
const MAX_TRAVELLERS = 30;

/** Keeps a typed count inside range; a cleared field reads as the minimum. */
function clamp(raw: string, min: number): number {
  const value = Number(raw);
  if (!Number.isFinite(value)) return min;
  return Math.min(MAX_TRAVELLERS, Math.max(min, Math.trunc(value)));
}

/**
 * Composes the booking message for the agency's mailbox.
 *
 * The same details the server stored, written as plain text so the request is
 * readable even when the visitor's mail client strips formatting. The total is
 * deliberately omitted: the server computes it and the agency confirms it, so
 * quoting a figure here could contradict the booking record.
 */
function composeEmail(
  fields: {
    name: string;
    phone: string;
    email: string;
    travelDate: string;
    adults: number;
    children: number;
    notes: string;
  },
  packageTitle: string,
  reference: string,
): { subject: string; body: string } {
  const lines = [
    `Reference: ${reference}`,
    '',
    `Package: ${packageTitle}`,
    `Travel date: ${fields.travelDate}`,
    `Travellers: ${fields.adults} adult(s)${
      fields.children > 0 ? `, ${fields.children} child(ren)` : ''
    }`,
    '',
    `Name: ${fields.name}`,
    `Phone: ${fields.phone}`,
    `Email: ${fields.email}`,
  ];

  if (fields.notes) lines.push('', 'Notes:', fields.notes);

  return {
    subject: `Booking request — ${fields.name} (${reference})`,
    body: lines.join('\n'),
  };
}

/**
 * "Book now" on a package card, opening a booking request form.
 *
 * Deliberately open to guests: requiring an account before the agency has even
 * quoted would lose the enquiry. A signed-in visitor still gets the booking
 * attached to their account, because the API reads the session when there is
 * one.
 *
 * No prices are submitted — the server recomputes the total from the stored
 * package price, so the figure shown here is indicative only.
 */
export function BookNowButton({
  packageId,
  packageTitle,
  price,
  priceOnRequest = false,
  priceMessage,
  recipientEmail,
  className,
}: BookNowButtonProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  /** Generated once per dialog so a double submit cannot double-book. */
  const idempotencyKey = useRef<string>('');

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  /** Kept so the success panel can re-open the draft if the tab was blocked. */
  const [composeUrl, setComposeUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  function handleOpen() {
    idempotencyKey.current = crypto.randomUUID();
    setReference(null);
    setComposeUrl(null);
    setError(null);
    setFieldErrors({});
    setOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);

    const data = new FormData(event.currentTarget);
    const leadName = String(data.get('name') ?? '');

    // Each control is capped individually, but the combined party can still
    // exceed what the server accepts — catch it here rather than letting the
    // request fail after a tab has already been opened.
    if (adults + children > MAX_TRAVELLERS) {
      setError(
        `Please contact us directly for groups over ${MAX_TRAVELLERS} travellers.`,
      );
      setSubmitting(false);
      return;
    }

    // Claimed synchronously inside the submit gesture: a browser only trusts
    // window.open while it is still handling the user's click, so the tab is
    // opened now and pointed at Gmail once the booking is saved. "noopener"
    // is omitted deliberately — it nulls the returned handle — so the link
    // back is severed manually instead.
    const composeTab = window.open('', '_blank');
    if (composeTab) composeTab.opener = null;

    /*
     * The API models each traveller individually, because a real booking needs
     * their names and ages. This public form only asks for a head count, so
     * the lead passenger is named and the rest are placeholders the agency
     * fills in when it confirms. Ages drive the adult/child split in pricing.
     */
    const travellers = [
      { name: leadName, age: 30 },
      ...Array.from({ length: Math.max(0, adults - 1) }, (_, i) => ({
        name: `Adult ${i + 2}`,
        age: 30,
      })),
      ...Array.from({ length: children }, (_, i) => ({
        name: `Child ${i + 1}`,
        age: 8,
      })),
    ];

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          packageId,
          travelDate: data.get('travelDate'),
          travellers,
          contact: {
            name: leadName,
            email: String(data.get('email') ?? ''),
            phone: String(data.get('phone') ?? ''),
          },
          notes: String(data.get('notes') ?? '') || undefined,
          idempotencyKey: idempotencyKey.current,
        }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok || !body?.success) {
        if (body?.error?.fields) setFieldErrors(body.error.fields);
        setError(body?.error?.message ?? 'Could not send your booking request.');
        // Nothing was saved, so the waiting tab has no draft to show.
        composeTab?.close();
        return;
      }

      const bookingReference = body.data.booking.bookingReference as string;

      // The booking is already stored; this hands the visitor a prefilled
      // Gmail draft addressed to the agency, matching how enquiries behave.
      const { subject, body: emailBody } = composeEmail(
        {
          name: leadName,
          phone: String(data.get('phone') ?? ''),
          email: String(data.get('email') ?? ''),
          travelDate: String(data.get('travelDate') ?? ''),
          adults,
          children,
          notes: String(data.get('notes') ?? ''),
        },
        packageTitle,
        bookingReference,
      );

      const url = buildGmailComposeUrl(
        recipientEmail || clientEnv.NEXT_PUBLIC_CONTACT_EMAIL,
        subject,
        emailBody,
      );
      setComposeUrl(url);
      setReference(bookingReference);
      formRef.current?.reset();
      // Refresh so an admin viewing the dashboard sees the new booking.
      router.refresh();

      // Hands off to the tab opened synchronously above, or to the mail client
      // directly on mobile; opening a tab here would be after an await and get
      // blocked.
      openComposeWindow(url, composeTab);
    } catch {
      setError('Network problem. Please check your connection and try again.');
      composeTab?.close();
    } finally {
      setSubmitting(false);
    }
  }

  const firstError = (field: string) => fieldErrors[field]?.[0];
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          'relative z-10 flex-1 rounded-full bg-accent-600 px-4 py-2.5',
          'text-sm font-medium text-white transition-colors',
          'hover:bg-accent-700 focus-visible:ring-2 focus-visible:ring-accent-500',
          'focus-visible:ring-offset-2 focus-visible:outline-none',
          className,
        )}
      >
        Book now
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={reference ? 'Booking request sent' : 'Book this trip'}
        description={reference ? undefined : packageTitle}
        size="lg"
      >
        {reference ? (
          <Alert variant="success" title={`Reference ${reference}`}>
            <p>
              Thank you — our team will confirm availability and call you within one
              working day. No payment is required yet.
            </p>
            {composeUrl && (
              <p className="mt-2">
                {/* On mobile the hand-off is a mailto:, which opens the phone's
                    own mail app rather than a tab — so the copy and the link
                    target follow whichever URL was actually built. */}
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
        ) : (
          <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {error && <Alert variant="error">{error}</Alert>}

            <div className="rounded-xl bg-sand-50 p-3.5 text-sm text-sand-700">
              {priceOnRequest ? (
                <>
                  <span className="font-medium text-sand-900">{priceMessage}</span> — send
                  this request and we will come back with a costed itinerary.
                </>
              ) : (
                <>
                  <span className="font-medium text-sand-900">{formatPrice(price)}</span>{' '}
                  per person on twin sharing. We confirm the final total before any
                  payment.
                </>
              )}
            </div>

            <div className="grid gap-4 [&>*]:min-w-0 sm:grid-cols-2">
              <Input
                label="Your name"
                name="name"
                autoComplete="name"
                required
                error={firstError('contact.name')}
                placeholder="Full name"
              />
              <Input
                label="Phone number"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                error={firstError('contact.phone')}
                placeholder="+91 98765 43210"
              />
            </div>

            <Input
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              required
              error={firstError('contact.email')}
              placeholder="you@example.com"
            />

            <div className="grid gap-4 [&>*]:min-w-0 sm:grid-cols-3">
              <Input
                label="Travel date"
                name="travelDate"
                type="date"
                required
                min={today}
                error={firstError('travelDate')}
              />
              {/* Number inputs rather than dropdowns: a fixed option list caps
                  the party size arbitrarily, and a large group could not be
                  entered at all. */}
              <Input
                label="Adults"
                name="adults"
                type="number"
                min={1}
                max={MAX_TRAVELLERS}
                value={String(adults)}
                onChange={(event) => setAdults(clamp(event.target.value, 1))}
              />
              <Input
                label="Children"
                name="children"
                type="number"
                min={0}
                max={MAX_TRAVELLERS}
                description="Under 12"
                value={String(children)}
                onChange={(event) => setChildren(clamp(event.target.value, 0))}
              />
            </div>

            <Textarea
              label="Anything else we should know?"
              name="notes"
              rows={3}
              error={firstError('notes')}
              placeholder="Preferred hotels, dietary requirements, celebrations…"
            />

            <Button type="submit" size="lg" loading={submitting} fullWidth>
              {submitting ? 'Sending…' : 'Send booking request'}
            </Button>

            <p className="text-center text-xs text-sand-500">
              No payment now. We confirm availability and the final price first.
            </p>
          </form>
        )}
      </Modal>
    </>
  );
}
