import { z } from 'zod';
import { paginationSchema, slugSchema } from './common.schema';
import { PACKAGE_TYPES } from '@/constants';

export const packageListQuerySchema = paginationSchema.extend({
  type: z.enum(PACKAGE_TYPES).optional(),
  destination: slugSchema.optional(),
  category: slugSchema.optional(),
  minPrice: z.coerce.number().min(0).max(100_000_000).optional(),
  maxPrice: z.coerce.number().min(0).max(100_000_000).optional(),
  minNights: z.coerce.number().int().min(0).max(365).optional(),
  maxNights: z.coerce.number().int().min(0).max(365).optional(),
  featured: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  search: z.string().trim().max(80).optional(),
  sort: z
    .enum(['newest', 'price_asc', 'price_desc', 'duration_asc', 'rating'])
    .default('newest'),
});

export type PackageListQuery = z.infer<typeof packageListQuerySchema>;

export const destinationListQuerySchema = paginationSchema.extend({
  type: z.enum(PACKAGE_TYPES).optional(),
  featured: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
});

export const blogListQuerySchema = paginationSchema.extend({
  category: z.string().trim().max(80).optional(),
  tag: z.string().trim().max(60).optional(),
  search: z.string().trim().max(80).optional(),
});

export const galleryListQuerySchema = paginationSchema.extend({
  album: slugSchema.optional(),
});
