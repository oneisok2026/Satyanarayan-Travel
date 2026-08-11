'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select, Checkbox } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/components/ui/Toast';
import { ImageUploadField } from './ImageUploadField';
import { slugify } from '@/lib/utils';

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'url'
  /** Newline-separated values, stored as a string array. */
  | 'list'
  /** Image URL with device upload, drag-and-drop and a preview. */
  | 'image';

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
        if (body?.error?.fields) setFieldErrors(body.error.fields);
        setError(body?.error?.message ?? 'Could not save your changes.');
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
          className="rounded-2xl bg-white p-6 ring-1 ring-sand-200"
        >
          <h2 className="font-display text-lg font-semibold text-sand-900">
            {section.title}
          </h2>
          {section.description && (
            <p className="mt-1 mb-4 text-sm text-sand-600">{section.description}</p>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
                  defaultValue={value == null ? '' : String(value)}
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

      <div className="flex items-center justify-end gap-3">
        <Link
          href={backHref}
          className="rounded-full px-5 py-2.5 text-sm font-medium text-sand-700 transition-colors hover:bg-sand-100"
        >
          Cancel
        </Link>
        <Button type="submit" loading={saving}>
          {saving ? 'Saving…' : id ? 'Save changes' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
