import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { packageWriteSchema } from '@/lib/validation/catalogue-admin.schema';
import { PACKAGE_FIELDS } from '@/components/admin/catalogue-fields';

const fieldSource = readFileSync(
  join(process.cwd(), 'src/components/admin/ItineraryField.tsx'),
  'utf8',
);

const editPageSource = readFileSync(
  join(process.cwd(), 'src/app/admin/(dashboard)/packages/[id]/page.tsx'),
  'utf8',
);

const base = {
  title: 'Test package',
  slug: 'test-package',
  type: 'domestic',
  shortDescription: 'A short description for testing.',
  description: 'A long enough description to satisfy the minimum length rule.',
  coverImage: { url: 'https://example.com/cover.jpg', alt: 'Cover' },
  duration: { nights: 2, days: 3 },
  price: 15000,
};

describe('itinerary admin field', () => {
  it('is exposed on the package form', () => {
    const field = PACKAGE_FIELDS.flatMap((section) => section.fields).find(
      (entry) => entry.name === 'itinerary',
    );
    expect(field?.kind).toBe('itinerary');
  });

  it('is no longer passed through, which would overwrite edits', () => {
    const keepLine = editPageSource
      .split('\n')
      .find((line) => line.includes('const keep ='));
    expect(keepLine).toBeDefined();
    expect(keepLine).not.toContain("'itinerary'");
    // Fields the form still does not expose must remain protected.
    expect(keepLine).toContain("'gallery'");
    expect(keepLine).toContain("'hotels'");
  });

  it('renumbers days from position, so there are no gaps or duplicates', () => {
    expect(fieldSource).toContain('day: index + 1');
  });

  it('serialises to a single hidden input the generic form can carry', () => {
    expect(fieldSource).toContain('type="hidden"');
    expect(fieldSource).toContain('JSON.stringify(days)');
  });
});

describe('itinerary round trip', () => {
  it('accepts what the editor produces', () => {
    // Exactly the shape ItineraryField serialises.
    const itinerary = [
      {
        day: 1,
        title: 'Haridwar arrival',
        description: 'Arrive Haridwar and attend the evening Ganga aarti.',
        meals: ['Dinner'],
        accommodation: 'Haridwar',
        activities: ['Ganga aarti'],
      },
      {
        day: 2,
        title: 'Haridwar to Barkot',
        description: 'Drive to Barkot through the hills.',
        meals: ['Breakfast', 'Dinner'],
        accommodation: 'Barkot',
        activities: [],
      },
    ];

    const result = packageWriteSchema.safeParse({ ...base, itinerary });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.itinerary).toHaveLength(2);
  });

  it('accepts a day with only the required fields filled in', () => {
    const result = packageWriteSchema.safeParse({
      ...base,
      itinerary: [
        { day: 1, title: 'Arrival', description: 'Arrive and check in.', meals: [], activities: [] },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects a day left blank, rather than storing an empty entry', () => {
    const result = packageWriteSchema.safeParse({
      ...base,
      itinerary: [{ day: 1, title: '', description: '', meals: [], activities: [] }],
    });
    expect(result.success).toBe(false);
  });

  it('still allows a package with no itinerary at all', () => {
    const result = packageWriteSchema.safeParse({ ...base, itinerary: [] });
    expect(result.success).toBe(true);
  });
});
