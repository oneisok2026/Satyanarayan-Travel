import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createBookingSchema } from '@/lib/validation/booking.schema';

const routeSource = readFileSync(
  join(process.cwd(), 'src/app/api/bookings/route.ts'),
  'utf8',
);

const modelSource = readFileSync(join(process.cwd(), 'src/models/Booking.ts'), 'utf8');

const serviceSource = readFileSync(
  join(process.cwd(), 'src/services/booking.service.ts'),
  'utf8',
);

const cardSource = readFileSync(
  join(process.cwd(), 'src/components/tours/PackageCard.tsx'),
  'utf8',
);

const buttonSource = readFileSync(
  join(process.cwd(), 'src/components/tours/BookNowButton.tsx'),
  'utf8',
);

describe('guest booking', () => {
  it('does not require an account to submit', () => {
    const post = routeSource.slice(routeSource.indexOf("route('POST /api/bookings'"));
    const handler = post.slice(0, post.indexOf('export const GET'));
    expect(handler).toContain('getCurrentUser()');
    expect(handler).not.toContain('requireUser()');
  });

  it('still attaches the booking to a signed-in customer', () => {
    expect(routeSource).toContain('...(user ? { userId: String(user._id) } : {})');
  });

  it('keeps a customer’s own booking list behind authentication', () => {
    const get = routeSource.slice(routeSource.indexOf("route('GET"));
    expect(get).toContain('requireUser()');
  });

  it('rate limits guests by IP, since there is no account to key on', () => {
    expect(routeSource).toContain('ip:${getClientIp(request)}');
  });

  it('allows a booking document without a userId', () => {
    expect(modelSource).toContain("userId: { type: Schema.Types.ObjectId, ref: 'User' }");
    expect(modelSource).not.toContain(
      "userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }",
    );
  });

  it('scopes idempotency correctly for a guest', () => {
    // Without this a guest replay would match another guest's key.
    expect(serviceSource).toContain('userId: { $exists: false }');
  });
});

describe('booking payload', () => {
  const base = {
    packageId: 'a'.repeat(24),
    travelDate: '2027-01-15',
    travellers: [{ name: 'Asha Verma', age: 30 }],
    contact: { name: 'Asha Verma', email: 'asha@example.com', phone: '+919000000001' },
  };

  it('accepts what the card form submits', () => {
    expect(createBookingSchema.safeParse(base).success).toBe(true);
  });

  it('carries no price fields, so a client cannot set the total', () => {
    const parsed = createBookingSchema.parse({ ...base, total: 1, price: 1 });
    expect(parsed).not.toHaveProperty('total');
    expect(parsed).not.toHaveProperty('price');
  });

  it('requires at least one traveller', () => {
    expect(createBookingSchema.safeParse({ ...base, travellers: [] }).success).toBe(false);
  });
});

describe('package card actions', () => {
  it('offers both Book now and Contact us', () => {
    expect(cardSource).toContain('<BookNowButton');
    expect(cardSource).toContain('Contact us');
    expect(cardSource).toContain('href="/contact"');
  });

  it('lifts both above the card’s stretched link so they are clickable', () => {
    // The title link covers the whole card via before:absolute inset-0.
    expect(cardSource).toContain('before:absolute before:inset-0');
    expect(cardSource).toContain('relative z-10 flex-1 rounded-full px-4');
    expect(buttonSource).toContain('relative z-10 flex-1 rounded-full bg-accent-600');
  });

  it('sends a fresh idempotency key per dialog, not per submit', () => {
    expect(buttonSource).toContain('idempotencyKey.current = crypto.randomUUID()');
  });
});

describe('party size', () => {
  const base = {
    packageId: 'a'.repeat(24),
    travelDate: '2027-01-15',
    contact: { name: 'Asha Verma', email: 'asha@example.com', phone: '+919000000001' },
  };

  it('lets a large group be entered, not just a fixed dropdown list', () => {
    // A <select> of options capped the party at 10 with no way past it.
    expect(buttonSource).toContain("type=\"number\"");
    expect(buttonSource).toContain('max={MAX_TRAVELLERS}');
    expect(buttonSource).not.toContain('<Select');
  });

  it('caps the form at the same limit the server enforces', () => {
    expect(buttonSource).toContain('const MAX_TRAVELLERS = 30');
    // 30 is exactly what createBookingSchema allows.
    const thirty = Array.from({ length: 30 }, () => ({ name: 'Traveller', age: 30 }));
    expect(createBookingSchema.safeParse({ ...base, travellers: thirty }).success).toBe(true);
    expect(
      createBookingSchema.safeParse({ ...base, travellers: [...thirty, { name: 'X', age: 30 }] })
        .success,
    ).toBe(false);
  });

  it('blocks an over-cap party before opening a tab or sending a request', () => {
    const handler = buttonSource.slice(buttonSource.indexOf('async function handleSubmit'));
    const guardAt = handler.indexOf('adults + children > MAX_TRAVELLERS');
    const openAt = handler.indexOf("window.open('', '_blank')");
    expect(guardAt).toBeGreaterThan(-1);
    expect(guardAt).toBeLessThan(openAt);
  });

  it('keeps a cleared count inside range rather than sending NaN', () => {
    expect(buttonSource).toContain('function clamp(');
    expect(buttonSource).toContain('Number.isFinite(value)');
  });
});

/**
 * A booking request must reach the agency's mailbox the same way an enquiry
 * does, so the two flows behave identically for the visitor.
 */
describe('booking reaches the agency mailbox', () => {
  it('opens a Gmail draft addressed from config, not a literal', () => {
    expect(buttonSource).toContain('buildGmailComposeUrl(CONTACT.email');
    expect(buttonSource).not.toMatch(/mailto:[a-z0-9.]+@/i);
  });

  it('claims the tab synchronously, before the network call', () => {
    // window.open after an await is treated as untrusted and blocked.
    const openedAt = buttonSource.indexOf("window.open('', '_blank')");
    const fetchAt = buttonSource.indexOf('await fetch(');
    expect(openedAt).toBeGreaterThan(-1);
    expect(openedAt).toBeLessThan(fetchAt);
  });

  it('opens the draft only after the booking is stored', () => {
    const savedAt = buttonSource.indexOf('setReference(bookingReference)');
    const openedAt = buttonSource.indexOf('openComposeWindow(url, composeTab)');
    expect(savedAt).toBeGreaterThan(-1);
    expect(openedAt).toBeGreaterThan(savedAt);
  });

  it('closes the waiting tab when nothing was saved', () => {
    expect(buttonSource).toContain('composeTab?.close()');
  });

  it('severs window.opener on the tab it opens', () => {
    expect(buttonSource).toContain('composeTab.opener = null');
  });

  it('carries the reference and package, and offers a re-open link', () => {
    expect(buttonSource).toContain('`Booking request — ${fields.name} (${reference})`');
    expect(buttonSource).toContain('`Package: ${packageTitle}`');
    expect(buttonSource).toContain('Open it again');
  });
});
