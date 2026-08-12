import { describe, expect, it } from 'vitest';
import { createEnquirySchema } from '@/lib/validation/enquiry.schema';
import { createBookingSchema } from '@/lib/validation/booking.schema';
import { updateProfileSchema } from '@/lib/validation/auth.schema';
import { paginationSchema, objectIdSchema } from '@/lib/validation/common.schema';
import { PAGINATION } from '@/constants';

/**
 * Customer isolation (PART 14) and admin authorization (PART 15).
 *
 * Ownership is decided from the session-derived user id at the service layer.
 * These tests assert the complementary half: no request schema exposes a field
 * that could redirect an operation onto another account.
 */

describe('no schema accepts a client-supplied owner', () => {
  it('booking schema has no userId field', () => {
    const parsed = createBookingSchema.parse({
      packageId: 'a'.repeat(24),
      travelDate: '2027-06-01',
      travellers: [{ name: 'Test Traveller', age: 30 }],
      contact: { name: 'Test User', email: 'a@b.com', phone: '+919876543210' },
      // A caller trying to book on someone else's behalf.
      userId: 'b'.repeat(24),
      customerId: 'c'.repeat(24),
    });

    expect(parsed).not.toHaveProperty('userId');
    expect(parsed).not.toHaveProperty('customerId');
  });

  it('enquiry schema has no userId or status field', () => {
    const parsed = createEnquirySchema.parse({
      type: 'general',
      name: 'Test User',
      email: 'a@b.com',
      phone: '+919876543210',
      consent: true,
      userId: 'b'.repeat(24),
      status: 'confirmed',
    });

    expect(parsed).not.toHaveProperty('userId');
    expect(parsed).not.toHaveProperty('status');
  });

  it('profile schema rejects role and status outright', () => {
    // .strict() — rejected, not silently dropped, so the attempt is visible.
    expect(updateProfileSchema.safeParse({ role: 'super_admin' }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ status: 'active' }).success).toBe(false);
  });
});

describe('pagination limits are enforced server-side', () => {
  it('caps limit at the configured maximum', () => {
    // Without the cap a client could request the entire collection.
    const result = paginationSchema.safeParse({ page: '1', limit: '100000' });
    expect(result.success).toBe(false);
  });

  it('applies defaults when omitted', () => {
    const parsed = paginationSchema.parse({});
    expect(parsed.page).toBe(PAGINATION.defaultPage);
    expect(parsed.limit).toBe(PAGINATION.defaultLimit);
  });

  it('rejects a non-positive page', () => {
    expect(paginationSchema.safeParse({ page: '0' }).success).toBe(false);
    expect(paginationSchema.safeParse({ page: '-5' }).success).toBe(false);
  });
});

describe('identifier validation', () => {
  it('rejects non-ObjectId input before it reaches a query', () => {
    expect(objectIdSchema.safeParse('not-an-id').success).toBe(false);
    expect(objectIdSchema.safeParse('../../admin').success).toBe(false);
    expect(objectIdSchema.safeParse({ $ne: null }).success).toBe(false);
    expect(objectIdSchema.safeParse('a'.repeat(24)).success).toBe(true);
  });
});

describe('enquiry consent', () => {
  it('requires explicit consent', () => {
    const result = createEnquirySchema.safeParse({
      type: 'general',
      name: 'Test User',
      email: 'a@b.com',
      phone: '+919876543210',
      consent: false,
    });
    expect(result.success).toBe(false);
  });

  it('accepts a guest enquiry with no account', () => {
    // PART 12: a visitor must be able to enquire without registering.
    const result = createEnquirySchema.safeParse({
      type: 'package',
      name: 'Guest Visitor',
      email: 'guest@example.com',
      phone: '+919876543210',
      packageId: 'a'.repeat(24),
      message: 'Please send me the itinerary and pricing details.',
      consent: true,
    });
    expect(result.success).toBe(true);
  });
});
