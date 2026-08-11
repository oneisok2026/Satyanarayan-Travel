import { z } from 'zod';
import { CONTENT_STATUSES, PACKAGE_TYPES, SOCIAL_PLATFORMS } from '@/constants';
import { objectIdSchema, slugSchema } from './common.schema';
import { slugify } from '@/lib/utils';

/**
 * Admin write schemas for the catalogue.
 *
 * Every field an admin may set is listed explicitly; anything else in a
 * payload is rejected by .strict(), so a stray or crafted key cannot reach
 * the database.
 */

const imageSchema = z.object({
  url: z.string().trim().url('Enter a valid image URL').max(1024),
  alt: z.string().trim().max(300).default(''),
  width: z.coerce.number().int().min(1).optional(),
  height: z.coerce.number().int().min(1).optional(),
  caption: z.string().trim().max(300).optional(),
});

const seoSchema = z
  .object({
    title: z.string().trim().max(70).optional().or(z.literal('')),
    description: z.string().trim().max(200).optional().or(z.literal('')),
    keywords: z.array(z.string().trim().max(60)).max(20).optional(),
  })
  .optional();

/** Status changes are their own operation — see the toggle endpoint. */
export const statusSchema = z.object({
  status: z.enum(CONTENT_STATUSES),
});

export const featuredSchema = z.object({
  featured: z.boolean(),
});

// ---------------------------------------------------------------- package --

const itineraryDaySchema = z.object({
  day: z.coerce.number().int().min(1).max(60),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  meals: z.array(z.string().trim().max(40)).max(6).default([]),
  accommodation: z.string().trim().max(200).optional().or(z.literal('')),
  activities: z.array(z.string().trim().max(120)).max(20).default([]),
});

const hotelSchema = z.object({
  city: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(60),
  nights: z.coerce.number().int().min(0).max(60),
  roomType: z.string().trim().max(120).optional().or(z.literal('')),
});

export const packageWriteSchema = z
  .object({
    title: z.string().trim().min(3, 'Title is too short').max(200),
    slug: slugSchema,
    type: z.enum(PACKAGE_TYPES),
    destinationIds: z.array(objectIdSchema).max(20).default([]),
    categoryId: objectIdSchema.optional().or(z.literal('')),
    shortDescription: z.string().trim().min(10).max(400),
    description: z.string().trim().min(20).max(30000),
    coverImage: imageSchema,
    gallery: z.array(imageSchema).max(30).default([]),
    duration: z.object({
      nights: z.coerce.number().int().min(0).max(365),
      days: z.coerce.number().int().min(1).max(365),
    }),
    price: z.coerce.number().min(0).max(100_000_000),
    compareAtPrice: z.coerce.number().min(0).max(100_000_000).optional(),
    childPrice: z.coerce.number().min(0).max(100_000_000).optional(),
    priceNote: z.string().trim().max(200).optional().or(z.literal('')),
    itinerary: z.array(itineraryDaySchema).max(60).default([]),
    inclusions: z.array(z.string().trim().max(300)).max(40).default([]),
    exclusions: z.array(z.string().trim().max(300)).max(40).default([]),
    hotels: z.array(hotelSchema).max(30).default([]),
    transportation: z.string().trim().max(2000).optional().or(z.literal('')),
    brochureUrl: z.string().trim().url().max(1024).optional().or(z.literal('')),
    featured: z.boolean().default(false),
    status: z.enum(CONTENT_STATUSES).default('draft'),
    seo: seoSchema,
  })
  .strict()
  // A package sold as "5 nights / 6 days" must not be saved as 5/2.
  .refine((value) => value.duration.days >= value.duration.nights, {
    message: 'Days must be at least equal to nights',
    path: ['duration', 'days'],
  })
  .refine(
    (value) =>
      value.compareAtPrice === undefined || value.compareAtPrice > value.price,
    {
      message: 'The compare-at price must be higher than the selling price',
      path: ['compareAtPrice'],
    },
  );

export const packageUpdateSchema = packageWriteSchema;

// ------------------------------------------------------------ destination --

export const destinationWriteSchema = z
  .object({
    name: z.string().trim().min(2).max(140),
    slug: slugSchema,
    type: z.enum(PACKAGE_TYPES),
    country: z.string().trim().min(2).max(120),
    region: z.string().trim().max(120).optional().or(z.literal('')),
    shortDescription: z.string().trim().min(10).max(300),
    description: z.string().trim().min(20).max(20000),
    coverImage: imageSchema,
    gallery: z.array(imageSchema).max(30).default([]),
    bestTimeToVisit: z.string().trim().max(200).optional().or(z.literal('')),
    highlights: z.array(z.string().trim().max(200)).max(20).default([]),
    featured: z.boolean().default(false),
    status: z.enum(CONTENT_STATUSES).default('draft'),
    sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
    seo: seoSchema,
  })
  .strict();

// --------------------------------------------------------------- category --

export const categoryWriteSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    slug: slugSchema,
    description: z.string().trim().max(600).optional().or(z.literal('')),
    icon: z.string().trim().max(80).optional().or(z.literal('')),
    featured: z.boolean().default(false),
    status: z.enum(CONTENT_STATUSES).default('published'),
    sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  })
  .strict();

// ---------------------------------------------------------------- service --

export const serviceWriteSchema = z
  .object({
    name: z.string().trim().min(2).max(140),
    slug: slugSchema,
    shortDescription: z.string().trim().min(10).max(300),
    description: z.string().trim().min(20).max(20000),
    icon: z.string().trim().max(80).optional().or(z.literal('')),
    coverImage: imageSchema.optional(),
    features: z.array(z.string().trim().max(200)).max(20).default([]),
    enquiryFields: z.array(z.string().trim().max(60)).max(20).default([]),
    featured: z.boolean().default(false),
    status: z.enum(CONTENT_STATUSES).default('published'),
    sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
    seo: seoSchema,
  })
  .strict();

// ------------------------------------------------------------------- blog --

export const blogWriteSchema = z
  .object({
    title: z.string().trim().min(3).max(200),
    slug: slugSchema,
    excerpt: z.string().trim().min(10).max(400),
    content: z.string().trim().min(20).max(100000),
    coverImage: imageSchema,
    category: z.string().trim().max(80).optional().or(z.literal('')),
    tags: z.array(z.string().trim().max(60)).max(20).default([]),
    authorName: z.string().trim().min(2).max(120),
    readingMinutes: z.coerce.number().int().min(1).max(120).default(3),
    status: z.enum(CONTENT_STATUSES).default('draft'),
    publishedAt: z.coerce.date().optional(),
    seo: seoSchema,
  })
  .strict();

// --------------------------------------------------------------- gallery --

/**
 * Gallery items are keyed by album rather than a slug of their own, so
 * `albumSlug` is derived from the album name here instead of being accepted
 * from the client — two admins typing "Kedarnath 2026" must land in the same
 * album regardless of spacing or case.
 */
export const galleryWriteSchema = z
  .object({
    album: z.string().trim().min(2).max(140),
    image: imageSchema,
    caption: z.string().trim().max(300).optional().or(z.literal('')),
    sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
    status: z.enum(CONTENT_STATUSES).default('published'),
  })
  .strict()
  .transform((value) => ({ ...value, albumSlug: slugify(value.album) }));

// ----------------------------------------------------------- hero slide --

/**
 * A call to action needs both halves to be usable, so a label without a link
 * (or the reverse) is rejected rather than silently rendering a dead button.
 */
const internalPath = z
  .string()
  .trim()
  .max(300)
  .refine(
    (value) => value === '' || value.startsWith('/') || /^https?:\/\//.test(value),
    'Enter a path like /tours or a full https:// URL',
  );

export const heroSlideWriteSchema = z
  .object({
    image: imageSchema,
    eyebrow: z.string().trim().max(80).optional().or(z.literal('')),
    headline: z.string().trim().min(2, 'Enter a headline').max(120),
    headlineAccent: z.string().trim().max(120).optional().or(z.literal('')),
    subheadline: z.string().trim().max(400).optional().or(z.literal('')),
    ctaLabel: z.string().trim().max(40).optional().or(z.literal('')),
    ctaHref: internalPath.optional().or(z.literal('')),
    secondaryCtaLabel: z.string().trim().max(40).optional().or(z.literal('')),
    secondaryCtaHref: internalPath.optional().or(z.literal('')),
    sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
    status: z.enum(CONTENT_STATUSES).default('published'),
  })
  .strict()
  .superRefine((value, context) => {
    if (Boolean(value.ctaLabel) !== Boolean(value.ctaHref)) {
      context.addIssue({
        code: 'custom',
        path: [value.ctaLabel ? 'ctaHref' : 'ctaLabel'],
        message: 'A button needs both a label and a link',
      });
    }
    if (Boolean(value.secondaryCtaLabel) !== Boolean(value.secondaryCtaHref)) {
      context.addIssue({
        code: 'custom',
        path: [value.secondaryCtaLabel ? 'secondaryCtaHref' : 'secondaryCtaLabel'],
        message: 'A button needs both a label and a link',
      });
    }
  });

// ---------------------------------------------------------- social link --

/**
 * The URL is rendered as an outbound anchor, so only http(s) is accepted.
 * `z.string().url()` alone would happily pass `javascript:` and `data:`.
 */
export const socialLinkWriteSchema = z
  .object({
    platform: z.enum(SOCIAL_PLATFORMS),
    url: z
      .string()
      .trim()
      .min(1, 'Enter a link')
      .max(500)
      .url('Enter a full URL, including https://')
      .refine(
        (value) => /^https?:\/\//i.test(value),
        'The link must start with http:// or https://',
      ),
    label: z.string().trim().max(60).optional().or(z.literal('')),
    sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
    status: z.enum(CONTENT_STATUSES).default('published'),
  })
  .strict();

export type PackageWriteInput = z.infer<typeof packageWriteSchema>;
export type DestinationWriteInput = z.infer<typeof destinationWriteSchema>;
export type CategoryWriteInput = z.infer<typeof categoryWriteSchema>;
export type ServiceWriteInput = z.infer<typeof serviceWriteSchema>;
export type BlogWriteInput = z.infer<typeof blogWriteSchema>;
