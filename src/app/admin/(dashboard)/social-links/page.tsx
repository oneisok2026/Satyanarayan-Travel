import type { Metadata } from 'next';
import { requireAdminPage } from '@/lib/firebase/auth';
import { connectToDatabase } from '@/lib/db/connect';
import { SocialLink } from '@/models/SocialLink';
import { PageHeading } from '@/components/admin/PageHeading';
import { NewItemButton } from '@/components/admin/NewItemButton';
import { CatalogueRowActions } from '@/components/admin/CatalogueRowActions';
import { EmptyState } from '@/components/ui/EmptyState';
import { SOCIAL_PLATFORM_LABELS } from '@/constants';

export const metadata: Metadata = {
  title: 'Social links',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/**
 * Social profiles shown in the site header.
 *
 * Listed in display order, so the page doubles as a preview of the icon row.
 */
export default async function AdminSocialLinksPage() {
  const admin = await requireAdminPage('/admin/social-links');

  await connectToDatabase();

  const links = await SocialLink.find({})
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();

  const published = links.filter((link) => link.status === 'published').length;

  return (
    <>
      <PageHeading
        title="Social links"
        description={`${links.length} ${links.length === 1 ? 'link' : 'links'} · ${published} shown in the header.`}
        action={
          admin.role === 'super_admin' ? (
            <NewItemButton href="/admin/social-links/new" label="New link" />
          ) : undefined
        }
      />

      {links.length === 0 ? (
        <EmptyState
          title="No social links yet"
          description="Add a link to show its icon on the right of the site's top bar."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {links.map((link) => (
            <li
              key={String(link._id)}
              className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-sand-200"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sand-900">
                  {SOCIAL_PLATFORM_LABELS[link.platform]}
                </p>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-xs text-brand-700 underline-offset-4 hover:underline"
                >
                  {link.url}
                </a>
                <p className="mt-1 text-xs text-sand-400">Order {link.sortOrder}</p>
              </div>

              <CatalogueRowActions
                resource="social-links"
                id={String(link._id)}
                title={SOCIAL_PLATFORM_LABELS[link.platform]}
                status={link.status}
                canManage={admin.role === 'super_admin'}
                editHref={`/admin/social-links/${String(link._id)}`}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
