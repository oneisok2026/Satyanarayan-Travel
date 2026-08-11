import { z } from 'zod';
import { STATIC_PAGES } from '@/constants/static-pages';

/**
 * SEO values for one page.
 *
 * `target` identifies what is being edited: `page:/about` for a fixed route,
 * or `<resource>:<id>` for a catalogue entry. Parsing it here rather than
 * accepting a free-form path matters — the page form becomes part of a
 * settings key, so an arbitrary value would let a caller write records the
 * admin screen never surfaces.
 *
 * Blank title and description are allowed and mean "fall back to the default",
 * so the lengths below only bound what is actually stored.
 */

const CONTENT_RESOURCES = ['packages', 'destinations', 'services', 'blogs'] as const;

const objectId = /^[a-f\d]{24}$/i;

const targetSchema = z.string().superRefine((value, context) => {
  const separator = value.indexOf(':');
  if (separator === -1) {
    context.addIssue({ code: 'custom', message: 'Choose a page' });
    return;
  }

  const kind = value.slice(0, separator);
  const rest = value.slice(separator + 1);

  if (kind === 'page') {
    if (!STATIC_PAGES.some((page) => page.path === rest)) {
      context.addIssue({ code: 'custom', message: 'Unknown page' });
    }
    return;
  }

  if (!CONTENT_RESOURCES.includes(kind as never)) {
    context.addIssue({ code: 'custom', message: 'Unknown page' });
    return;
  }

  if (!objectId.test(rest)) {
    context.addIssue({ code: 'custom', message: 'Malformed identifier' });
  }
});

export const pageSeoSchema = z
  .object({
    target: targetSchema,
    title: z.string().trim().max(70, 'Keep the title under 70 characters').default(''),
    description: z
      .string()
      .trim()
      .max(200, 'Keep the description under 200 characters')
      .default(''),
    // Accepted as the comma-separated string the form submits, and split here
    // so the stored shape is a clean array regardless of spacing.
    keywords: z
      .string()
      .trim()
      .max(500, 'Keep the keyword list under 500 characters')
      .default('')
      .transform((value) =>
        value
          .split(',')
          .map((entry) => entry.trim())
          .filter((entry) => entry.length > 0)
          .slice(0, 20),
      ),
  })
  .strict();

export type PageSeoInput = z.infer<typeof pageSeoSchema>;

/** Splits a validated target into its kind and identifier. */
export function parseSeoTarget(target: string): { kind: string; id: string } {
  const separator = target.indexOf(':');
  return {
    kind: target.slice(0, separator),
    id: target.slice(separator + 1),
  };
}
