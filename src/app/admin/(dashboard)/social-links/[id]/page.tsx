import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/firebase/auth';
import { getCatalogueItem } from '@/services/catalogue-admin.service';
import { objectIdSchema } from '@/lib/validation/common.schema';
import { PageHeading } from '@/components/admin/PageHeading';
import { CatalogueForm } from '@/components/admin/CatalogueForm';
import { SOCIAL_LINK_FIELDS } from '@/components/admin/catalogue-fields';
import { SOCIAL_PLATFORM_LABELS, type SocialPlatform } from '@/constants';
import { isAppError } from '@/lib/errors';

export const metadata: Metadata = {
  title: 'Edit social link',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/**
 * Editing content is a super_admin action, checked here and again in the API.
 * A plain admin gets 404 rather than 403, matching how the rest of the admin
 * area avoids confirming what exists.
 */
export default async function EditSocialLinkPage({
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
    item = await getCatalogueItem('social-links', parsed.data);
  } catch (error) {
    if (isAppError(error) && error.code === 'NOT_FOUND') notFound();
    throw error;
  }

  const platform = item.platform as SocialPlatform;
  const title = SOCIAL_PLATFORM_LABELS[platform] ?? 'Social link';

  return (
    <>
      <PageHeading
        title={`Edit: ${title}`}
        description="Changes are recorded in the audit log."
        backHref="/admin/social-links"
        backLabel="All links"
      />

      <CatalogueForm
        resource="social-links"
        id={parsed.data}
        sections={SOCIAL_LINK_FIELDS}
        initial={item}
        backHref="/admin/social-links"
      />
    </>
  );
}
