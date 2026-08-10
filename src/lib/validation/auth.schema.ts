import { z } from 'zod';

/** Firebase ID tokens are JWTs; reject anything structurally impossible early. */
export const sessionSchema = z.object({
  idToken: z
    .string()
    .min(50, 'Invalid token')
    .max(4096, 'Invalid token')
    .regex(/^[\w-]+\.[\w-]+\.[\w-]+$/, 'Invalid token format'),
});

export type SessionInput = z.infer<typeof sessionSchema>;

const phoneRegex = /^[+]?[\d\s()-]{7,20}$/;

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2, 'Name is too short').max(120).optional(),
    phone: z
      .string()
      .trim()
      .regex(phoneRegex, 'Enter a valid phone number')
      .optional()
      .or(z.literal('')),
    profile: z
      .object({
        address: z.string().trim().max(300).optional().or(z.literal('')),
        city: z.string().trim().max(120).optional().or(z.literal('')),
        state: z.string().trim().max(120).optional().or(z.literal('')),
        country: z.string().trim().max(120).optional().or(z.literal('')),
        postalCode: z.string().trim().max(20).optional().or(z.literal('')),
        dateOfBirth: z.coerce.date().max(new Date(), 'Date must be in the past').optional(),
      })
      .optional(),
    preferences: z
      .object({
        marketingEmails: z.boolean().optional(),
        whatsappUpdates: z.boolean().optional(),
      })
      .optional(),
  })
  // Role and status are deliberately absent: a customer must never be able to
  // promote themselves by adding a field to this payload.
  .strict();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
