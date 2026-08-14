import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The admin editors are used on phones.
 *
 * These forms are long and field-dense, and the agency edits packages from a
 * handset. The failure mode is not subtle breakage — it is a form wider than
 * the viewport, where a long unbroken value (a pasted image URL, a package
 * title) pushes the page sideways and the inputs become unusable.
 *
 * Asserted against the source because the layout is Tailwind utilities with no
 * runtime behaviour to exercise: a mobile-first class dropped in a refactor is
 * caught here rather than on someone's phone.
 */

const SRC = join(process.cwd(), 'src');
const read = (file: string) => readFileSync(join(SRC, file), 'utf8');

const FORM = read('components/admin/CatalogueForm.tsx');
const IMAGE_FIELD = read('components/admin/ImageUploadField.tsx');
const ITINERARY_FIELD = read('components/admin/ItineraryField.tsx');
const LAYOUT = read('app/admin/(dashboard)/layout.tsx');
const HEADING = read('components/admin/PageHeading.tsx');

describe('catalogue form fits a phone viewport', () => {
  it('starts single-column and only splits into two at sm', () => {
    // A grid that is two columns at every width halves the field width on a
    // 360px screen. The negative match requires an unprefixed occurrence —
    // a preceding ':' means it is breakpoint-scoped and therefore fine.
    expect(FORM).toContain('sm:grid-cols-2');
    expect(FORM).not.toMatch(/(?<![:\w-])grid-cols-2/);
  });

  it('lets grid cells shrink below their content width', () => {
    // A grid track defaults to min-width:auto and refuses to shrink below its
    // content's intrinsic width, which is how one long value widens the page.
    expect(FORM).toContain('[&>*]:min-w-0');
  });

  it('uses tighter section padding on phones than on desktop', () => {
    expect(FORM).toMatch(/\bp-4\b[^"]*\bsm:p-6\b/);
  });

  it('pins the action bar to the viewport, not to the form box', () => {
    // `sticky` cannot work here: a sticky element is clipped to its parent's
    // box, and the parent is the form — an ordinary block as tall as its
    // content. Sticking to the bottom of that box parks the bar at the end of
    // the form, several screens below the fold, which is the bug it was meant
    // to fix. Only `fixed` escapes the form and reaches the viewport.
    expect(FORM).toContain('fixed inset-x-0 bottom-0');
    expect(FORM).not.toContain('sticky bottom-0');
    // Released back into the normal flow once there is room for it.
    expect(FORM).toContain('sm:static');
  });

  it('reserves scroll room so the last field clears the fixed bar', () => {
    // Without a spacer the bar covers the final input at the foot of the page.
    expect(FORM).toMatch(/aria-hidden="true"\s+className="h-\d+ sm:hidden"/);
  });

  it('respects the home-indicator inset on the fixed action bar', () => {
    expect(FORM).toContain('env(safe-area-inset-bottom)');
  });

  it('keeps both actions on one row with Save on the right', () => {
    // Cancel is declared first so it falls left on desktop; row-reverse puts
    // Save on the dominant side at every width, and keeps both on one line
    // rather than stacking into two full-width blocks on a phone.
    expect(FORM).toContain('flex-row-reverse');
    expect(FORM).not.toContain('flex-col-reverse');
  });

  it('sizes the submit button to its label rather than the row', () => {
    // flex-1 stretched Save across most of the bar, which read as a banner
    // rather than a button. The bar is pinned to the bottom edge, so the
    // control does not need extra width to be findable.
    expect(FORM).not.toMatch(/className="flex-1 justify-center/);
    expect(FORM).toMatch(/size="sm"/);
  });

  it('matches the heights of the two actions', () => {
    // Button takes its height from a size variant, so the Cancel link needs an
    // explicit height to sit level with it rather than relying on padding.
    expect(FORM).toContain('h-9 shrink-0 items-center');
    expect(FORM).toMatch(/sm:h-11/);
  });

  it('gives the fixed bar an opaque background', () => {
    // A translucent bar over form fields makes both unreadable; the fixed bar
    // sits directly on top of inputs, unlike the old in-flow one.
    expect(FORM).toMatch(/bg-white px-4 py-3/);
  });
});

describe('image field fits a phone viewport', () => {
  it('stacks the preview above the controls before sm', () => {
    expect(IMAGE_FIELD).toMatch(/flex-col gap-3 sm:flex-row/);
  });

  it('gives the preview a full-width box that becomes fixed-width at sm', () => {
    expect(IMAGE_FIELD).toMatch(/\bw-full\b[^"]*\bsm:w-56\b/);
  });

  it('lets the control column shrink rather than overflow', () => {
    expect(IMAGE_FIELD).toContain('min-w-0 flex-1');
  });

  it('wraps the upload and remove buttons instead of overflowing', () => {
    expect(IMAGE_FIELD).toContain('flex-wrap');
  });
});

describe('itinerary field fits a phone viewport', () => {
  it('starts single-column inside a day', () => {
    expect(ITINERARY_FIELD).toContain('sm:grid-cols-2');
    expect(ITINERARY_FIELD).not.toMatch(/(?<![:\w-])grid-cols-2/);
  });

  it('truncates a long day title rather than widening the row', () => {
    expect(ITINERARY_FIELD).toContain('min-w-0 flex-1 truncate');
  });
});

describe('admin chrome fits a phone viewport', () => {
  it('lets the main column shrink below its content width', () => {
    // Without min-w-0 a wide child stretches the flex row and the sidebar
    // drawer overlay no longer covers the page.
    expect(LAYOUT).toContain('min-w-0 flex-1');
  });

  it('scales page gutters down on phones', () => {
    expect(LAYOUT).toMatch(/\bp-4\b[^"]*\bsm:p-5\b[^"]*\blg:p-8\b/);
  });

  it('breaks a long heading instead of widening the page', () => {
    expect(HEADING).toContain('min-w-0');
    expect(HEADING).toContain('break-words');
  });

  it('scales the heading size down on phones', () => {
    expect(HEADING).toMatch(/\btext-xl\b[^"]*\bsm:text-2xl\b/);
  });
});

describe('save failures stay visible on a phone', () => {
  it('surfaces a root-level validation error in the message', () => {
    // An unknown-key or cross-field failure has an empty path, so it maps to
    // no rendered input. Without this the admin sees a generic message and no
    // highlighted field — which is how the journeyDates 422 read as unfixable.
    expect(FORM).toContain('_root');
  });
});
