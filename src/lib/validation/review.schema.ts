import { z } from 'zod';
import { objectIdSchema, paginationSchema } from './common.schema';
import { REVIEW_STATUSES } from '@/constants';

export const createReviewSchema = z.object({
  packageId: objectIdSchema,
  rating: z.coerce.number().int().min(1, 'Choose a rating').max(5),
  title: z.string().trim().max(160).optional(),
  comment: z
    .string()
    .trim()
    .min(20, 'Please write at least 20 characters')
    .max(4000),
  travelDate: z.coerce.date().max(new Date(), 'Travel date must be in the past').optional(),
});

export const reviewListQuerySchema = paginationSchema.extend({
  packageId: objectIdSchema.optional(),
});

export const moderateReviewSchema = z.object({
  status: z.enum(REVIEW_STATUSES).refine((value) => value !== 'pending', {
    message: 'Choose approved or rejected',
  }),
  reason: z.string().trim().max(500).optional(),
});
