import type { Metadata } from 'next';
import { requireAdminPage } from '@/lib/firebase/auth';
import { connectToDatabase } from '@/lib/db/connect';
import { ContactDetail } from '@/models/ContactDetail';
import { PageHeading } from '@/components/admin/PageHeading';
import { NewItemButton } from '@/components/admin/NewItemButton';
import { CatalogueRowActions } from '@/components/admin/CatalogueRowActions';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import {
  CONTACT_DETAIL_KIND_LABELS,
  CONTACT_PLACEMENT_LABELS,
} from '@/constants';

export const metadata: Metadata = {
  title: 'Contact details',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/**
 * Phone numbers and email addresses shown across the site.
 *
 * Listed in display order, so the page doubles as a preview of the top bar and
 * the footer contact column.
 */
export default async function AdminContactDetailsPage() {
  const admin = await requireAdminPage('/admin/contact-details');

  await connectToDatabase();

  const details = await ContactDetail.find({})
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();

  const published = details.filter((detail) => detail.status === 'published').length;

  return (
    <>
      <PageHeading
        title="Contact details"
        description={`${details.length} ${details.length === 1 ? 'entry' : 'entries'} · ${published} shown on the website.`}
        action={
          admin.role === 'super_admin' ? (
            <NewItemButton href="/admin/contact-details/new" label="New detail" />
          ) : undefined
        }
      />

      {details.length === 0 ? (
        <>
          <Alert variant="info" className="mb-6" title="Using the built-in numbers">
            Nothing has been added here yet, so the website is showing the
            numbers and address configured when it was deployed. Adding an entry
            below takes over from those completely — add every number and
            address you want shown, not just the new ones.
          </Alert>

          <EmptyState
            title="No contact details yet"
            description="Add a phone number or email address to show it in the top bar, the footer and on the contact page."
          />
        </>
      ) : (
        <ul className="flex flex-col gap-3">
          {details.map((detail) => (
            <li
              key={String(detail._id)}
              className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-sand-200"
            >
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-medium text-sand-900">
                  {detail.value}
                  {detail.isPrimary && <Badge tone="info">Main</Badge>}
                </p>
                <p className="mt-1 text-xs text-sand-500">
                  {CONTACT_DETAIL_KIND_LABELS[detail.kind]}
                  {detail.label ? ` · ${detail.label}` : ''} ·{' '}
                  {CONTACT_PLACEMENT_LABELS[detail.placement]}
                </p>
                <p className="mt-1 text-xs text-sand-400">Order {detail.sortOrder}</p>
              </div>

              <CatalogueRowActions
                resource="contact-details"
                id={String(detail._id)}
                title={detail.value}
                status={detail.status}
                canManage={admin.role === 'super_admin'}
                editHref={`/admin/contact-details/${String(detail._id)}`}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
