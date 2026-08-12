import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const source = readFileSync(
  join(process.cwd(), 'src/services/catalogue-admin.service.ts'),
  'utf8',
);

const navSource = readFileSync(
  join(process.cwd(), 'src/components/admin/AdminNav.tsx'),
  'utf8',
);

/**
 * Uploaded images are reachable only through the record that referenced them,
 * so a delete that leaves them behind silently consumes database storage that
 * nothing can ever surface or reclaim.
 */
describe('orphaned image cleanup', () => {
  it('releases images for every resource, not just gallery and hero slides', () => {
    expect(source).toContain('await releaseImages(document)');
    // The old form only cleaned up two resources.
    expect(source).not.toMatch(/resource === 'gallery' \|\| resource === 'hero-slides'/);
  });

  it('walks nested structures, so a package gallery is not missed', () => {
    // Hand-listing fields per resource goes stale when a field is added.
    expect(source).toContain('function collectImageUrls');
    expect(source).toContain('Array.isArray(value)');
  });

  it('bounds the walk, so a cyclic document cannot hang the delete', () => {
    expect(source).toContain('depth > 6');
  });

  it('reclaims the old image when one is replaced', () => {
    expect(source).toContain('releaseReplacedImages');
    // Only URLs the update dropped may be deleted.
    expect(source).toContain("filter((url) => !kept.has(url))");
  });

  it('never deletes an externally hosted image', () => {
    // imageIdFromUrl and objectPathFromUrl both return null for foreign hosts.
    expect(source).toContain('imageIdFromUrl(url)');
    expect(source).toContain('objectPathFromUrl(url)');
  });
});

describe('removed admin sections', () => {
  it('drops Reviews and Admin users from the sidebar', () => {
    expect(navSource).not.toContain('/admin/reviews');
    expect(navSource).not.toContain('/admin/users');
  });

  it('keeps the rest of the navigation intact', () => {
    for (const href of [
      '/admin/enquiries',
      '/admin/bookings',
      '/admin/packages',
      '/admin/gallery',
      '/admin/pages',
      '/admin/seo',
      '/admin/settings',
    ]) {
      expect(navSource).toContain(href);
    }
  });
});
