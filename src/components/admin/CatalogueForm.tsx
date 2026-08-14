'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select, Checkbox } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/components/ui/Toast';
import { ImageUploadField } from './ImageUploadField';
import { ItineraryField, type ItineraryDay } from './ItineraryField';
import { cn, slugify } from '@/lib/utils';

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'url'
  /** Newline-separated values, stored as a string array. */
  | 'list'
  /**
   * Comma-separated values on a single line, stored as a string array.
   *
   * Distinct from `list`, which is a textarea for long entries one per line.
   * Keywords are short and conventionally written comma-separated, and the SEO
   * screen already presents them that way.
   */
  | 'tags'
  /** Image URL with device upload, drag-and-drop and a preview. */
  | 'image'
  /** Repeating day-by-day entries, submitted as a JSON array. */
  | 'itinerary';

export interface FormField {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  description?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  /** Dotted path for nested values, e.g. "duration.nights". */
  path?: string;
  rows?: number;
  min?: number;
  max?: number;
  /**
   * Storage folder for `image` fields. Must be one of UPLOAD_FOLDERS; defaults
   * to the resource name, which is already in that list for every editor.
   */
  uploadFolder?: string;
  /** Renders full width in the two-column grid. */
  wide?: boolean;
}

export interface FormSection {
  title: string;
  description?: string;
  fields: FormField[];
}

interface CatalogueFormProps {
  resource: string;
  /** Absent when creating. */
  id?: string;
  sections: FormSection[];
  initial: Record<string, unknown>;
  backHref: string;
  /** Extra values merged into the payload, e.g. untouched arrays. */
  passthrough?: Record<string, unknown>;
}

/** Reads a possibly-dotted path out of the initial record. */
function readPath(source: Record<string, unknown>, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (value, key) =>
        value && typeof value === 'object'
          ? (value as Record<string, unknown>)[key]
          : undefined,
      source,
    );
}

/** Writes a possibly-dotted path into the outgoing payload. */
function writePath(target: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  let cursor = target;

  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i] as string;
    if (typeof cursor[key] !== 'object' || cursor[key] === null) cursor[key] = {};
    cursor = cursor[key] as Record<string, unknown>;
  }

  cursor[keys[keys.length - 1] as string] = value;
}

/**
 * Schema-driven editor for the catalogue.
 *
 * Fields are declared per resource rather than hand-written per page, so the
 * five editors stay consistent. The server re-validates everything with Zod
 * and rejects unknown keys, so this form is convenience, not enforcement.
 */
export function CatalogueForm({
  resource,
  id,
  sections,
  initial,
  backHref,
  passthrough = {},
}: CatalogueFormProps) {
  const router = useRouter();
  const { notify } = useToast();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setSaving(true);

    const data = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = { ...passthrough };

    for (const section of sections) {
      for (const field of section.fields) {
        const path = field.path ?? field.name;
        const raw = data.get(field.name);

        let value: unknown;
        switch (field.kind) {
          case 'checkbox':
            value = raw === 'on';
            break;
          case 'number':
            value = raw === '' || raw === null ? undefined : Number(raw);
            break;
          case 'list':
            value = String(raw ?? '')
              .split('\n')
              .map((entry) => entry.trim())
              .filter((entry) => entry.length > 0);
            break;
          case 'tags':
            value = String(raw ?? '')
              .split(',')
              .map((entry) => entry.trim())
              .filter((entry) => entry.length > 0);
            break;
          case 'itinerary':
            // Serialised by ItineraryField into one hidden input. A malformed
            // value would fail the server's schema anyway, so an unparseable
            // string degrades to an empty list rather than throwing here.
            try {
              value = JSON.parse(String(raw ?? '[]'));
            } catch {
              value = [];
            }
            break;
          default:
            value = String(raw ?? '');
        }

        // Optional numbers must be omitted rather than sent as undefined.
        if (field.kind === 'number' && value === undefined) continue;

        writePath(payload, path, value);
      }
    }

    try {
      const response = await fetch(
        id
          ? `/api/admin/catalogue/${resource}/${id}`
          : `/api/admin/catalogue/${resource}`,
        {
          method: id ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(payload),
        },
      );

      const body = await response.json().catch(() => null);

      if (!response.ok || !body?.success) {
        const fields = body?.error?.fields as Record<string, string[]> | undefined;
        if (fields) setFieldErrors(fields);

        // A validation failure whose path is empty — an unknown key, or a
        // cross-field rule — belongs to no rendered input, so without this the
        // admin sees only "Could not save your changes" and no highlighted
        // field. Surfacing the reason turns a dead end into something
        // actionable.
        const rootIssues = fields?._root;
        const message = body?.error?.message ?? 'Could not save your changes.';

        setError(
          rootIssues?.length ? `${message}: ${rootIssues.join('; ')}` : message,
        );
        return;
      }

      notify(body.message ?? 'Saved.');
      router.push(backHref);
      router.refresh();
    } catch {
      setError('Network problem. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  const firstError = (field: FormField) =>
    fieldErrors[field.path ?? field.name]?.[0];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      {error && <Alert variant="error">{error}</Alert>}

      {sections.map((section) => (
        <section
          key={section.title}
          // Tighter padding on phones: at 360–412px the desktop p-6 left the
          // inputs barely wider than their own labels.
          className="rounded-2xl bg-white p-4 ring-1 ring-sand-200 sm:p-6"
        >
          <h2 className="font-display text-base font-semibold text-sand-900 sm:text-lg">
            {section.title}
          </h2>
          {section.description && (
            <p className="mt-1 mb-4 text-sm text-sand-600">{section.description}</p>
          )}

          {/*
            min-w-0 on every cell: a grid track defaults to min-width:auto and
            would refuse to shrink below its content's intrinsic width, which is
            how a long placeholder or an unbroken URL pushes the whole form
            wider than the phone viewport.
          */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2 [&>*]:min-w-0">
            {section.fields.map((field) => {
              const path = field.path ?? field.name;
              const value = readPath(initial, path);
              const wrapper = field.wide ? 'sm:col-span-2' : undefined;

              if (field.kind === 'checkbox') {
                return (
                  <div key={field.name} className={wrapper}>
                    <Checkbox
                      name={field.name}
                      defaultChecked={Boolean(value)}
                      label={field.label}
                      error={firstError(field)}
                    />
                  </div>
                );
              }

              if (field.kind === 'itinerary') {
                return (
                  <ItineraryField
                    key={field.name}
                    name={field.name}
                    label={field.label}
                    description={field.description}
                    defaultValue={Array.isArray(value) ? (value as ItineraryDay[]) : []}
                    error={firstError(field)}
                    className={wrapper ?? 'sm:col-span-2'}
                  />
                );
              }

              if (field.kind === 'image') {
                return (
                  <ImageUploadField
                    key={field.name}
                    name={field.name}
                    label={field.label}
                    folder={field.uploadFolder ?? resource}
                    defaultValue={value == null ? '' : String(value)}
                    required={field.required}
                    description={field.description}
                    error={firstError(field)}
                    className={wrapper ?? 'sm:col-span-2'}
                  />
                );
              }

              if (field.kind === 'select') {
                return (
                  <Select
                    key={field.name}
                    name={field.name}
                    label={field.label}
                    options={field.options ?? []}
                    defaultValue={value == null ? '' : String(value)}
                    required={field.required}
                    description={field.description}
                    error={firstError(field)}
                    wrapperClassName={wrapper}
                  />
                );
              }

              if (field.kind === 'textarea' || field.kind === 'list') {
                const text =
                  field.kind === 'list' && Array.isArray(value)
                    ? value.join('\n')
                    : String(value ?? '');

                return (
                  <Textarea
                    key={field.name}
                    name={field.name}
                    label={field.label}
                    rows={field.rows ?? 4}
                    defaultValue={text}
                    required={field.required}
                    description={field.description}
                    placeholder={field.placeholder}
                    error={firstError(field)}
                    wrapperClassName={wrapper ?? 'sm:col-span-2'}
                  />
                );
              }

              return (
                <Input
                  key={field.name}
                  name={field.name}
                  label={field.label}
                  type={
                    field.kind === 'number'
                      ? 'number'
                      : field.kind === 'url'
                        ? 'url'
                        : 'text'
                  }
                  defaultValue={
                    // A stored array joins with ", " — String() on an array
                    // would render "a,b" and lose the spacing on every reload.
                    field.kind === 'tags' && Array.isArray(value)
                      ? value.join(', ')
                      : value == null
                        ? ''
                        : String(value)
                  }
                  required={field.required}
                  description={field.description}
                  placeholder={field.placeholder}
                  min={field.min}
                  max={field.max}
                  error={firstError(field)}
                  wrapperClassName={wrapper}
                  // Auto-fill the slug from the title when creating.
                  onBlur={
                    !id && (field.name === 'title' || field.name === 'name')
                      ? (event) => {
                          const form = event.currentTarget.form;
                          const slugInput = form?.elements.namedItem('slug');
                          if (
                            slugInput instanceof HTMLInputElement &&
                            slugInput.value === ''
                          ) {
                            slugInput.value = slugify(event.currentTarget.value);
                          }
                        }
                      : undefined
                  }
                />
              );
            })}
          </div>
        </section>
      ))}

      {/*
        Spacer holding room for the fixed bar below, so the last field can
        still be scrolled clear of it. Only needed while the bar is fixed.
        h-14 covers the bar's 36px controls plus its vertical padding; the
        safe-area inset is handled by the bar itself.
      */}
      <div aria-hidden="true" className="h-14 sm:hidden" />

      {/*
        Fixed to the viewport on phones, in the normal flow from sm up.

        `fixed` rather than `sticky`: a sticky element is clipped to its own
        parent's box, and this bar's parent is the form — an ordinary block as
        tall as its content. Sticking to the bottom of that box just parks the
        bar at the end of the form, which is exactly where it already was and
        several screens below the fold. Fixed positioning escapes the form and
        pins to the viewport, so the actions are always in reach.
      */}
      <div
        className={cn(
          // Row-reverse on every width: Cancel is declared first so it sits
          // left on desktop, and reversing puts Save on the right — the
          // dominant side — while keeping both on one line on a phone.
          'fixed inset-x-0 bottom-0 z-30 flex flex-row-reverse items-center gap-3',
          'border-t border-sand-200 bg-white px-4 py-3',
          'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
          // justify-start on a row-reverse track packs items at the right,
          // preserving the original desktop alignment.
          'sm:static sm:z-auto sm:justify-start sm:border-0 sm:bg-transparent',
          'sm:p-0 sm:pb-0',
        )}
      >
        {/*
          Sized to its label rather than stretched: flex-1 made the button span
          most of the row, which read as a banner instead of a control. The
          bar is fixed at the bottom edge, so it needs no help being found.
        */}
        <Button
          type="submit"
          loading={saving}
          size="sm"
          className="shrink-0 sm:h-11 sm:px-6 sm:text-[0.9375rem]"
        >
          {saving ? 'Saving…' : id ? 'Save changes' : 'Create'}
        </Button>

        {/*
          Explicit height rather than padding, so it lines up with the Button
          beside it — that one sets its height from its size variant, which
          padding alone would not match.
        */}
        <Link
          href={backHref}
          className={cn(
            'inline-flex h-9 shrink-0 items-center rounded-full border border-sand-300 px-4',
            'text-sm font-medium text-sand-700 transition-colors hover:bg-sand-100',
            'sm:h-11 sm:border-0 sm:px-5',
          )}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
