import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/firebase/auth';
import { PageHeading } from '@/components/admin/PageHeading';
import { CatalogueForm } from '@/components/admin/CatalogueForm';
import { FIELDS_BY_RESOURCE } from '@/components/admin/catalogue-fields';

type Resource = keyof typeof FIELDS_BY_RESOURCE;

interface NewCatalogueItemProps {
  resource: Resource;
  /** Singular noun for the heading, e.g. "package". */
  noun: string;
  backHref: string;
  backLabel: string;
  /**
   * Starting values for a blank form. Only needed where a sensible default
   * differs from empty — a status, or a type preselected by the entry point.
   */
  initial?: Record<string, unknown>;
}

/**
 * Blank catalogue editor.
 *
 * Creating is a super_admin action, checked here and again in the API. A plain
 * admin gets 404 rather than 403, matching how the rest of the admin area
 * avoids confirming what exists.
 *
 * `CatalogueForm` already handles both modes — omitting `id` makes it POST to
 * the collection endpoint instead of PATCHing an item — so this only supplies
 * the guard, the heading and the starting values.
 */
export async function NewCatalogueItem({
  resource,
  noun,
  backHref,
  backLabel,
  initial = {},
}: NewCatalogueItemProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'super_admin') notFound();

  return (
    <>
      <PageHeading
        title={`New ${noun}`}
        description="Changes are recorded in the audit log."
        backHref={backHref}
        backLabel={backLabel}
      />

      <CatalogueForm
        resource={resource}
        sections={FIELDS_BY_RESOURCE[resource]}
        initial={initial}
        backHref={backHref}
      />
    </>
  );
}
