import { describe, expect, it } from 'vitest';
import { SERVICE_FIELDS } from '@/components/admin/catalogue-fields';
import { UPLOAD_FOLDERS } from '@/constants';

const allFields = SERVICE_FIELDS.flatMap((section) => section.fields);
const field = (name: string) => allFields.find((entry) => entry.name === name);

describe('service admin image fields', () => {
  it('exposes an editable showcase image bound to the model path', () => {
    const url = field('showcaseImageUrl');
    expect(url?.kind).toBe('image');
    expect(url?.path).toBe('showcaseImage.url');
    expect(field('showcaseImageAlt')?.path).toBe('showcaseImage.alt');
  });

  it('exposes the banner image too, so it is no longer edit-only via seed', () => {
    expect(field('coverImageUrl')?.path).toBe('coverImage.url');
    expect(field('coverImageAlt')?.path).toBe('coverImage.alt');
  });

  it('uploads to a folder the upload API accepts', () => {
    for (const name of ['showcaseImageUrl', 'coverImageUrl']) {
      const folder = field(name)?.uploadFolder;
      expect(folder).toBeDefined();
      expect(UPLOAD_FOLDERS.includes(folder as never)).toBe(true);
    }
  });

  it('leaves both images optional so they can be removed', () => {
    expect(field('showcaseImageUrl')?.required).toBeFalsy();
    expect(field('coverImageUrl')?.required).toBeFalsy();
  });
});
