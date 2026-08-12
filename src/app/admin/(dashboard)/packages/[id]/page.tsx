import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/firebase/auth';
import { getCatalogueItem } from '@/services/catalogue-admin.service';
import { objectIdSchema } from '@/lib/validation/common.schema';
import { PageHeading } from '@/components/admin/PageHeading';
import { CatalogueForm } from '@/components/admin/CatalogueForm';
import { PACKAGE_FIELDS } from '@/components/admin/catalogue-fields';
import { isAppError } from '@/lib/errors';

export const metadata: Metadata = {
  title: 'Edit package',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/**
 * Editing content is a super_admin action, checked here and again in the API.
 * A plain admin gets 404 rather than 403, matching how the rest of the admin
 * area avoids confirming what exists.
 */
export default async function EditPACKAGEPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'super_admin') notFound();

  const { id } = await params;
  const parsed = objectIdSchema.safeParse(id);
  if (!parsed.success) notFound();

  let item: Record<string, unknown>;
  try {
    item = await getCatalogueItem('packages', parsed.data);
  } catch (error) {
    if (isAppError(error) && error.code === 'NOT_FOUND') notFound();
    throw error;
  }

  // Fields the form does not expose are sent back unchanged, so saving a
  // basic edit cannot silently wipe an itinerary or gallery.
  // itinerary is edited by the form now, so it must not be passed through — a
  // stale copy would overwrite the admin's changes on save.
  const keep = ['destinationIds', 'categoryId', 'gallery', 'journeyDates', 'hotels'];
  const passthrough: Record<string, unknown> = {};
  for (const key of keep) {
    if (item[key] !== undefined) passthrough[key] = item[key];
  }

  const title = String(item.title ?? item.name ?? 'Untitled');

  return (
    <>
      <PageHeading
        title={`Edit: ${title}`}
        description="Changes are recorded in the audit log."
        backHref="/admin/packages"
        backLabel="All packages"
      />

      <CatalogueForm
        resource="packages"
        id={parsed.data}
        sections={PACKAGE_FIELDS}
        initial={item}
        passthrough={passthrough}
        backHref="/admin/packages"
      />
    </>
  );
}
