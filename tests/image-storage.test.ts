import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { imageIdFromUrl } from '@/lib/db/image-store';

const storeSource = readFileSync(
  join(process.cwd(), 'src/lib/db/image-store.ts'),
  'utf8',
);

const uploadSource = readFileSync(
  join(process.cwd(), 'src/app/api/admin/uploads/route.ts'),
  'utf8',
);

const serveSource = readFileSync(
  join(process.cwd(), 'src/app/api/images/[id]/route.ts'),
  'utf8',
);

describe('image storage backend', () => {
  it('stores uploads in the application database, not an external bucket', () => {
    expect(uploadSource).toContain("from '@/lib/db/image-store'");
    expect(uploadSource).not.toContain('firebase/storage');
  });

  it('uses GridFS rather than a Buffer field, which is capped at 16 MB', () => {
    expect(storeSource).toContain('GridFSBucket');
    expect(storeSource).toContain('openUploadStream');
    expect(storeSource).toContain('openDownloadStream');
  });

  it('returns a relative URL, so one database works across environments', () => {
    expect(storeSource).toContain('url: `/api/images/${id.toHexString()}`');
  });
});

describe('imageIdFromUrl', () => {
  it('recognises a URL this module produced', () => {
    const id = 'a'.repeat(24);
    expect(imageIdFromUrl(`/api/images/${id}`)).toBe(id);
  });

  it('ignores externally hosted images, which are not ours to delete', () => {
    expect(imageIdFromUrl('https://images.unsplash.com/photo-123')).toBeNull();
    expect(
      imageIdFromUrl('https://firebasestorage.googleapis.com/v0/b/x/o/y'),
    ).toBeNull();
  });

  it('rejects a malformed or traversal-shaped id', () => {
    expect(imageIdFromUrl('/api/images/../../etc/passwd')).toBeNull();
    expect(imageIdFromUrl('/api/images/notanobjectid')).toBeNull();
    expect(imageIdFromUrl('/api/images/')).toBeNull();
  });
});

describe('image serving', () => {
  it('is cached immutably, so a repeat view costs no database read', () => {
    expect(serveSource).toContain('max-age=31536000, immutable');
    expect(serveSource).toContain('ETag');
    expect(serveSource).toContain('if-none-match');
  });

  it('refuses to let a browser re-interpret the bytes', () => {
    expect(serveSource).toContain('X-Content-Type-Options');
  });
});
