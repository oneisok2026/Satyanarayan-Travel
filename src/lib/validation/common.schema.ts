import { z } from 'zod';
import { PAGINATION } from '@/constants';

/** Query-string primitives shared by every listing endpoint. */

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(PAGINATION.defaultPage),
  // Capped server-side so a client cannot request the whole collection.
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION.maxLimit)
    .default(PAGINATION.defaultLimit),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'Invalid identifier');

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(220)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug');

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Enter a valid email address')
  .max(254);

export const phoneSchema = z
  .string()
  .trim()
  .min(7, 'Enter a valid phone number')
  .max(24)
  .regex(/^[+]?[\d\s()-]+$/, 'Enter a valid phone number');

export const nameSchema = z
  .string()
  .trim()
  .min(2, 'Please enter your full name')
  .max(120);

/**
 * Honeypot + timing check shared by every public form.
 *
 * `website` is invisible to humans, so any value means a bot. `formLoadedAt`
 * catches scripted posts that submit faster than a person could type.
 */
export const spamGuardSchema = z.object({
  website: z.string().max(0, 'Rejected').optional().or(z.literal('')),
  formLoadedAt: z.coerce.number().int().optional(),
});

export function offsetFor(page: number, limit: number): number {
  return (page - 1) * limit;
}

/** Parses URLSearchParams into a plain object for schema validation. */
export function searchParamsToObject(params: URLSearchParams): Record<string, string> {
  const output: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    if (value !== '') output[key] = value;
  }
  return output;
}
