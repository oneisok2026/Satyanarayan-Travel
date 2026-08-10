import { z } from 'zod';
import { emailSchema, nameSchema, objectIdSchema, phoneSchema } from './common.schema';
import { BOOKING_STATUSES, PAYMENT_STATUSES } from '@/constants';

const travellerSchema = z.object({
  name: nameSchema,
  age: z.coerce.number().int().min(0).max(120),
  gender: z.enum(['male', 'female', 'other']).optional(),
});

/**
 * Booking request.
 *
 * Note there are no price fields: totals are computed server-side from the
 * stored package price, so a tampered payload cannot change what is owed.
 */
export const createBookingSchema = z.object({
  packageId: objectIdSchema,
  travelDate: z.coerce.date(),
  travellers: z
    .array(travellerSchema)
    .min(1, 'Add at least one traveller')
    .max(30, 'Please contact us directly for groups over 30'),
  contact: z.object({
    name: nameSchema,
    email: emailSchema,
    phone: phoneSchema,
  }),
  notes: z.string().trim().max(2000).optional(),
  /** Client-generated key so a retried submit cannot double-book. */
  idempotencyKey: z.string().trim().min(8).max(100).optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const updateBookingStatusSchema = z.object({
  status: z.enum(BOOKING_STATUSES),
});

export const updatePaymentStatusSchema = z.object({
  paymentStatus: z.enum(PAYMENT_STATUSES),
});

export const bookingListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(20),
  status: z.enum(BOOKING_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  search: z.string().trim().max(80).optional(),
});
