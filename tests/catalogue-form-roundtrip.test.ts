import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { z } from 'zod';
import {
  packageWriteSchema,
  destinationWriteSchema,
  categoryWriteSchema,
  serviceWriteSchema,
  blogWriteSchema,
  galleryWriteSchema,
  heroSlideWriteSchema,
  socialLinkWriteSchema,
  contactDetailWriteSchema,
} from '@/lib/validation/catalogue-admin.schema';
import { FIELDS_BY_RESOURCE } from '@/components/admin/catalogue-fields';
import type { FormSection } from '@/components/admin/CatalogueForm';

/**
 * Every catalogue editor must be able to save what it loads.
 *
 * The write schemas are `.strict()`, so a key the form submits but the schema
 * does not declare rejects the whole request with a 422 — and the admin sees
 * "Could not save your changes" with no indication of which field is at
 * fault. That is exactly how `journeyDates` broke every package edit: the edit
 * page passed the stored value through on save, but the schema had no such
 * key.
 *
 * These tests reconstruct the payload the browser actually sends — the
 * declared fields plus the page's passthrough list — and parse it. A field
 * added to a model or a passthrough list without a matching schema entry fails
 * here rather than in production.
 */

const SCHEMAS = {
  packages: packageWriteSchema,
  destinations: destinationWriteSchema,
  categories: categoryWriteSchema,
  services: serviceWriteSchema,
  blogs: blogWriteSchema,
  gallery: galleryWriteSchema,
  'hero-slides': heroSlideWriteSchema,
  'social-links': socialLinkWriteSchema,
  'contact-details': contactDetailWriteSchema,
} as const;

type Resource = keyof typeof SCHEMAS;

/**
 * The `keep` array from each editor's page, read from source.
 *
 * Parsed rather than imported because the pages are Server Components that
 * pull in Firebase and the database on import. Reading the literal keeps this
 * test honest: it tracks what the page really sends.
 */
function passthroughKeysFor(resource: Resource): string[] {
  const path = `src/app/admin/(dashboard)/${resource}/[id]/page.tsx`;

  let source: string;
  try {
    source = readFileSync(path, 'utf8');
  } catch {
    // Not every resource has a passthrough-style edit page.
    return [];
  }

  const match = source.match(/const keep(?::\s*string\[\])?\s*=\s*\[([^\]]*)\]/);
  if (!match) return [];

  return [...(match[1] ?? '').matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1] as string);
}

/** A value that satisfies the schema for a field of this kind. */
function sampleFor(field: FormSection['fields'][number]): unknown {
  // Fields carrying a cross-field or format rule the generic sample by kind
  // cannot satisfy.
  switch (field.name) {
    case 'slug':
      return 'a-valid-slug';
    // A package's compare-at price must exceed its selling price.
    case 'price':
      return 1000;
    case 'compareAtPrice':
      return 2000;
    // Hero slide buttons take an internal path or a full URL, not a PDF link.
    case 'ctaHref':
    case 'secondaryCtaHref':
      return '/tours';
    case 'value':
      // contact-details: validated against `kind`, which samples as 'phone'.
      return '+91 89101 02904';
    case 'url':
      return 'https://example.com';
    case 'album':
      return 'Sample album';
    default:
      break;
  }

  switch (field.kind) {
    case 'checkbox':
      return true;
    case 'number':
      // Satisfies min:1 constraints (duration.days, readingMinutes) while
      // staying inside every max.
      return 1;
    case 'list':
    case 'itinerary':
    // `tags` submits a comma-separated line but is stored — and validated —
    // as an array, same as `list`.
    case 'tags':
      return [];
    case 'image':
      return 'https://example.com/photo.jpg';
    case 'url':
      return 'https://example.com/brochure.pdf';
    case 'select':
      return field.options?.[0]?.value ?? '';
    default:
      // Long enough for the strictest min() on a text field (20 chars).
      return 'Sample text that is long enough';
  }
}

/** The payload CatalogueForm builds for this resource, as the browser sends it. */
function buildPayload(resource: Resource): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  // Passthrough first, matching the form: declared fields win on conflict.
  // Most passthrough values are arrays; the scalars need a value of the right
  // shape or the schema rejects them for the wrong reason.
  const PASSTHROUGH_SAMPLES: Record<string, unknown> = {
    categoryId: '507f1f77bcf86cd799439011',
    publishedAt: '2026-01-15T00:00:00.000Z',
  };

  for (const key of passthroughKeysFor(resource)) {
    payload[key] = key in PASSTHROUGH_SAMPLES ? PASSTHROUGH_SAMPLES[key] : [];
  }

  for (const section of FIELDS_BY_RESOURCE[resource] as FormSection[]) {
    for (const field of section.fields) {
      const path = field.path ?? field.name;
      const value = sampleFor(field);

      const keys = path.split('.');
      let cursor = payload;
      for (let i = 0; i < keys.length - 1; i += 1) {
        const key = keys[i] as string;
        if (typeof cursor[key] !== 'object' || cursor[key] === null) cursor[key] = {};
        cursor = cursor[key] as Record<string, unknown>;
      }
      cursor[keys[keys.length - 1] as string] = value;
    }
  }

  return payload;
}

describe.each(Object.keys(SCHEMAS) as Resource[])('%s editor', (resource) => {
  it('submits nothing the write schema rejects as unknown', () => {
    const result = SCHEMAS[resource].safeParse(buildPayload(resource));

    const unknownKeys = result.success
      ? []
      : result.error.issues
          .filter((issue) => issue.code === 'unrecognized_keys')
          .flatMap((issue) => (issue as z.ZodIssue & { keys: string[] }).keys);

    // Named in the failure so the fix is obvious: add the key to the schema,
    // or stop sending it.
    expect(unknownKeys).toEqual([]);
  });

  it('every field the form declares is accepted by the schema', () => {
    const result = SCHEMAS[resource].safeParse(buildPayload(resource));

    // Any remaining issue is a sample value this test chose badly, not a real
    // defect — but an unknown-key issue always means the form and schema have
    // drifted apart.
    if (!result.success) {
      const paths = result.error.issues.map(
        (issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`,
      );
      expect(paths).toEqual([]);
    }

    expect(result.success).toBe(true);
  });
});

/**
 * Meta keywords are entered comma-separated but stored as an array, so the
 * two representations have to line up in both directions.
 */
describe('seo meta keywords', () => {
  it('is offered on every editor that has an SEO section', () => {
    const withSeo = (Object.keys(SCHEMAS) as Resource[]).filter((resource) =>
      (FIELDS_BY_RESOURCE[resource] as FormSection[]).some(
        (section) => section.title === 'Search engine listing',
      ),
    );

    // The section is shared, so this guards against one editor drifting.
    expect(withSeo.length).toBeGreaterThan(0);

    for (const resource of withSeo) {
      const fields = (FIELDS_BY_RESOURCE[resource] as FormSection[])
        .flatMap((section) => section.fields)
        .map((field) => field.path ?? field.name);

      expect(fields).toContain('seo.keywords');
    }
  });

  it('accepts an array of terms', () => {
    const payload = buildPayload('packages');
    (payload.seo as Record<string, unknown>).keywords = [
      'kashmir tour',
      'dal lake houseboat',
    ];

    const result = packageWriteSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.seo?.keywords).toEqual(['kashmir tour', 'dal lake houseboat']);
    }
  });

  it('drops an emptied box rather than storing an empty array', () => {
    // The form submits every field it renders, so a cleared box arrives as [].
    const payload = buildPayload('packages');
    (payload.seo as Record<string, unknown>).keywords = [];

    const result = packageWriteSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.seo?.keywords).toBeUndefined();
  });

  it('rejects more terms than the schema allows', () => {
    const payload = buildPayload('packages');
    (payload.seo as Record<string, unknown>).keywords = Array.from(
      { length: 21 },
      (_, i) => `term-${i}`,
    );

    expect(packageWriteSchema.safeParse(payload).success).toBe(false);
  });
});

/**
 * The specific regression: a package edit sends back the stored departure
 * dates, so the schema must accept them.
 */
describe('package journeyDates passthrough', () => {
  it('is listed in the edit page passthrough', () => {
    expect(passthroughKeysFor('packages')).toContain('journeyDates');
  });

  it('is accepted with stored departure dates attached', () => {
    const payload = {
      ...buildPayload('packages'),
      journeyDates: [
        {
          startDate: '2026-04-10T00:00:00.000Z',
          endDate: '2026-04-16T00:00:00.000Z',
          seatsAvailable: 12,
          priceOverride: 48000,
        },
      ],
    };

    expect(packageWriteSchema.safeParse(payload).success).toBe(true);
  });

  it('is accepted as an empty array, which is what most packages carry', () => {
    const payload = { ...buildPayload('packages'), journeyDates: [] };
    expect(packageWriteSchema.safeParse(payload).success).toBe(true);
  });
});
