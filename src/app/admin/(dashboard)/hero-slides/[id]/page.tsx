import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/firebase/auth';
import { getCatalogueItem } from '@/services/catalogue-admin.service';
import { objectIdSchema } from '@/lib/validation/common.schema';
import { PageHeading } from '@/components/admin/PageHeading';
import { CatalogueForm } from '@/components/admin/CatalogueForm';
import { HERO_SLIDE_FIELDS } from '@/components/admin/catalogue-fields';
import { isAppError } from '@/lib/errors';

export const metadata: Metadata = {
  title: 'Edit hero slide',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/**
 * Editing content is a super_admin action, checked here and again in the API.
 * A plain admin gets 404 rather than 403, matching how the rest of the admin
 * area avoids confirming what exists.
 */
export default async function EditHeroSlidePage({
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
    item = await getCatalogueItem('hero-slides', parsed.data);
  } catch (error) {
    if (isAppError(error) && error.code === 'NOT_FOUND') notFound();
    throw error;
  }

  const title = String(item.headline ?? 'Untitled');

  return (
    <>
      <PageHeading
        title={`Edit: ${title}`}
        description="Changes are recorded in the audit log."
        backHref="/admin/hero-slides"
        backLabel="All slides"
      />

      <CatalogueForm
        resource="hero-slides"
        id={parsed.data}
        sections={HERO_SLIDE_FIELDS}
        initial={item}
        backHref="/admin/hero-slides"
      />
    </>
  );
}
