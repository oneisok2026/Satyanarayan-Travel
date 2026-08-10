import { z } from 'zod';
import {
  emailSchema,
  nameSchema,
  objectIdSchema,
  phoneSchema,
  spamGuardSchema,
} from './common.schema';
import { ENQUIRY_STATUSES, ENQUIRY_TYPES } from '@/constants';

const travellersSchema = z.object({
  adults: z.coerce.number().int().min(1).max(60).default(1),
  children: z.coerce.number().int().min(0).max(60).default(0),
});

export const createEnquirySchema = spamGuardSchema.extend({
  type: z.enum(ENQUIRY_TYPES).default('general'),
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  packageId: objectIdSchema.optional(),
  destinationId: objectIdSchema.optional(),
  serviceSlug: z.string().trim().max(60).optional(),
  travelDate: z.coerce
    .date()
    .min(new Date(Date.now() - 86_400_000), 'Travel date cannot be in the past')
    .optional(),
  travellers: travellersSchema.optional(),
  budget: z.coerce.number().min(0).max(100_000_000).optional(),
  message: z.string().trim().max(4000).optional(),
  /** Per-service extras; values are constrained to primitives. */
  serviceDetails: z
    .record(z.string().max(60), z.union([z.string().max(500), z.number(), z.boolean()]))
    .optional(),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Please accept the privacy policy to continue' }),
  }),
});

export type CreateEnquiryInput = z.infer<typeof createEnquirySchema>;

export const updateEnquiryStatusSchema = z.object({
  status: z.enum(ENQUIRY_STATUSES),
});

export const addEnquiryNoteSchema = z.object({
  note: z.string().trim().min(1, 'Note cannot be empty').max(4000),
});

export const enquiryListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(20),
  status: z.enum(ENQUIRY_STATUSES).optional(),
  type: z.enum(ENQUIRY_TYPES).optional(),
  search: z.string().trim().max(80).optional(),
});
