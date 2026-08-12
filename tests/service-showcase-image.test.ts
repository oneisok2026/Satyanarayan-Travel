import { describe, expect, it } from 'vitest';
import { serviceWriteSchema } from '@/lib/validation/catalogue-admin.schema';

const base = {
  name: 'Hotel Booking',
  slug: 'hotel-booking',
  shortDescription: 'Rooms negotiated at rates we hold directly.',
  description: 'We book hotels across India and abroad, from budget to five-star.',
};

describe('service showcase image', () => {
  it('accepts an uploaded showcase image', () => {
    const result = serviceWriteSchema.safeParse({
      ...base,
      showcaseImage: { url: 'https://example.com/hotel.jpg', alt: 'A hotel room' },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.showcaseImage?.url).toBe('https://example.com/hotel.jpg');
      expect(result.data.showcaseImage?.alt).toBe('A hotel room');
    }
  });

  it('treats a cleared image as removal rather than a validation error', () => {
    // What the form submits when the admin presses "Remove": every rendered
    // field is still sent, so the URL arrives as an empty string.
    const result = serviceWriteSchema.safeParse({
      ...base,
      showcaseImage: { url: '', alt: '' },
      coverImage: { url: '', alt: '' },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.showcaseImage).toBeUndefined();
      expect(result.data.coverImage).toBeUndefined();
    }
  });

  it('still rejects a non-empty invalid URL', () => {
    const result = serviceWriteSchema.safeParse({
      ...base,
      showcaseImage: { url: 'not-a-url', alt: '' },
    });

    expect(result.success).toBe(false);
  });

  it('keeps the two images independent', () => {
    const result = serviceWriteSchema.safeParse({
      ...base,
      coverImage: { url: 'https://example.com/banner.jpg', alt: 'Banner' },
      showcaseImage: { url: '', alt: '' },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.coverImage?.url).toBe('https://example.com/banner.jpg');
      expect(result.data.showcaseImage).toBeUndefined();
    }
  });
});
