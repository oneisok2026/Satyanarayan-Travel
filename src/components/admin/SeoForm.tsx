'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input, Textarea, Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/components/ui/Toast';

/**
 * SEO editor.
 *
 * One form for the whole public surface: choosing a page loads its current
 * values, and saving routes to the right place — a settings override for the
 * fixed routes, the record's own `seo` fields for catalogue entries. The admin
 * does not need to know which is which.
 */

export interface SeoTargetOption {
  value: string;
  label: string;
  group: string;
  path: string;
  title: string;
  description: string;
  keywords: string[];
  defaultTitle: string;
  defaultDescription: string;
}

const TITLE_LIMIT = 70;
const DESCRIPTION_LIMIT = 200;
const KEYWORDS_LIMIT = 500;

export function SeoForm({ targets }: { targets: SeoTargetOption[] }) {
  const router = useRouter();
  const { notify } = useToast();

  const [selected, setSelected] = useState(targets[0]?.value ?? '');

  const current = useMemo(
    () => targets.find((target) => target.value === selected),
    [targets, selected],
  );

  const [title, setTitle] = useState(current?.title ?? '');
  const [description, setDescription] = useState(current?.description ?? '');
  const [keywords, setKeywords] = useState((current?.keywords ?? []).join(', '));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Switching pages replaces the form with that page's stored values. */
  function handleSelect(value: string) {
    const next = targets.find((target) => target.value === value);
    setSelected(value);
    setTitle(next?.title ?? '');
    setDescription(next?.description ?? '');
    setKeywords((next?.keywords ?? []).join(', '));
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const response = await fetch('/api/admin/seo/pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ target: selected, title, description, keywords }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok || !body?.success) {
        setError(body?.error?.message ?? 'Could not save the SEO values.');
        return;
      }

      notify(body.message ?? 'SEO updated.');
      router.refresh();
    } catch {
      setError('Network problem. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  // Grouped so the fixed pages stay together, above the catalogue entries.
  const options = useMemo(
    () =>
      targets.map((target) => ({
        value: target.value,
        label: target.label,
        group: target.group,
      })),
    [targets],
  );

  if (targets.length === 0) {
    return (
      <Alert variant="info">
        No pages available yet. Publish some content to edit its SEO here.
      </Alert>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white p-6 ring-1 ring-sand-200"
    >
      <div className="flex flex-col gap-5">
        {error && <Alert variant="error">{error}</Alert>}

        <Select
          label="Page"
          value={selected}
          onChange={(event) => handleSelect(event.target.value)}
          description="Which page this SEO applies to."
          options={options}
          wrapperClassName="max-w-md"
        />

        <Input
          label="Meta Title"
          value={title}
          maxLength={TITLE_LIMIT}
          placeholder={current?.defaultTitle || 'Site name only'}
          onChange={(event) => setTitle(event.target.value)}
          description={`Shown in the browser tab and Google results. ${title.length}/${TITLE_LIMIT} characters. Leave blank to use the default.`}
        />

        <Textarea
          label="Meta Description"
          rows={4}
          value={description}
          maxLength={DESCRIPTION_LIMIT}
          placeholder={current?.defaultDescription}
          onChange={(event) => setDescription(event.target.value)}
          description={`The snippet shown under the title in Google. ${description.length}/${DESCRIPTION_LIMIT} characters. Leave blank to use the default.`}
        />

        <Textarea
          label="Keywords"
          rows={3}
          value={keywords}
          maxLength={KEYWORDS_LIMIT}
          placeholder="tour packages, kashmir tour, honeymoon packages"
          onChange={(event) => setKeywords(event.target.value)}
          description="Comma-separated keywords, e.g. tour packages, kolkata, char dham. Up to 20."
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={saving}>
            {saving ? 'Saving…' : 'Save SEO'}
          </Button>

          {current && (
            <Link
              href={current.path}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-brand-700 underline-offset-4 hover:underline"
            >
              Preview page
            </Link>
          )}
        </div>
      </div>
    </form>
  );
}
