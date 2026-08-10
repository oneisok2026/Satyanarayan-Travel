import type { Metadata } from 'next';
import { requireAdminPage } from '@/lib/firebase/auth';
import { connectToDatabase } from '@/lib/db/connect';
import { SiteSetting } from '@/models/SiteSetting';
import { PageHeading } from '@/components/admin/PageHeading';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Settings',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface SettingRow {
  id: string;
  key: string;
  value: string;
  group: string;
  isPublic: boolean;
  updatedAt: string;
}

export default async function AdminSettingsPage() {
  await requireAdminPage('/admin/settings');

  await connectToDatabase();

  const documents = await SiteSetting.find({}).sort({ group: 1, key: 1 }).lean();

  const rows: SettingRow[] = documents.map((doc) => ({
    id: String(doc._id),
    key: doc.key,
    value:
      typeof doc.value === 'object'
        ? JSON.stringify(doc.value)
        : String(doc.value ?? ''),
    group: doc.group,
    isPublic: doc.isPublic,
    updatedAt: doc.updatedAt.toISOString(),
  }));

  const columns: Column<SettingRow>[] = [
    {
      key: 'key',
      header: 'Setting',
      render: (row) => (
        <span className="font-mono text-xs font-medium text-sand-900">{row.key}</span>
      ),
    },
    {
      key: 'value',
      header: 'Value',
      render: (row) => <span className="text-sm text-sand-700">{row.value}</span>,
    },
    {
      key: 'group',
      header: 'Group',
      secondary: true,
      render: (row) => <Badge tone="neutral">{row.group}</Badge>,
    },
    {
      key: 'visibility',
      header: 'Visibility',
      secondary: true,
      render: (row) => (
        <Badge tone={row.isPublic ? 'info' : 'neutral'}>
          {row.isPublic ? 'Public' : 'Private'}
        </Badge>
      ),
    },
    {
      key: 'updated',
      header: 'Updated',
      align: 'right',
      render: (row) => formatDate(row.updatedAt),
    },
  ];

  return (
    <>
      <PageHeading
        title="Settings"
        description="Site-wide values used across the public website."
      />

      <Alert variant="info" className="mb-6" title="Editing settings">
        These values are seeded and read by the site. Editing them from this
        screen is not enabled yet — change them via the seed script, or ask for
        the edit form to be added.
      </Alert>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        empty={{
          title: 'No settings stored',
          description: 'Run the seed script to populate the default site settings.',
        }}
      />
    </>
  );
}
