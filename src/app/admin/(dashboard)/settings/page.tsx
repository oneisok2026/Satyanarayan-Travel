import type { Metadata } from 'next';
import { requireAdminPage } from '@/lib/firebase/auth';
import { PageHeading } from '@/components/admin/PageHeading';
import { ChangePasswordCard } from '@/components/admin/ChangePasswordCard';

export const metadata: Metadata = {
  title: 'Settings',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/**
 * Account settings for the signed-in admin.
 *
 * Content-shaped settings live with the content they affect rather than here:
 * the price enquiry message is on the Packages screen, and contact details are
 * under Content → Contact details.
 */
export default async function AdminSettingsPage() {
  const admin = await requireAdminPage('/admin/settings');

  return (
    <>
      <PageHeading title="Settings" description="Your admin account." />

      <ChangePasswordCard email={admin.email} />
    </>
  );
}
