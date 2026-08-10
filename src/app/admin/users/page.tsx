import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/firebase/auth';
import { listCustomers } from '@/services/admin.service';
import { PageHeading } from '@/components/admin/PageHeading';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { CustomerActions } from '@/components/admin/CustomerActions';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Admin users',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface AdminRow {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt?: string;
}

const label = (value: string) =>
  value.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase());

/**
 * Admin user management — super_admin only.
 *
 * Guarded here and again in the API, so a customer who guesses the URL gets a
 * 404 and a plain admin cannot escalate anyone via the endpoint.
 */
export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'super_admin') notFound();

  const [admins, superAdmins] = await Promise.all([
    listCustomers({ role: 'admin', page: 1, limit: 60 }),
    listCustomers({ role: 'super_admin', page: 1, limit: 60 }),
  ]);

  const rows: AdminRow[] = [...superAdmins.customers, ...admins.customers];

  const columns: Column<AdminRow>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-sand-900">{row.name}</p>
          <p className="truncate text-xs text-sand-500">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) => (
        <Badge tone={row.role === 'super_admin' ? 'accent' : 'brand'}>
          {label(row.role)}
        </Badge>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last sign-in',
      secondary: true,
      render: (row) => (row.lastLoginAt ? formatDate(row.lastLoginAt) : 'Never'),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge tone={row.status === 'active' ? 'success' : 'danger'}>
          {label(row.status)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <CustomerActions
          customerId={row.id}
          name={row.name}
          role={row.role}
          status={row.status}
          isSelf={row.id === String(user._id)}
          canChangeRole
        />
      ),
    },
  ];

  return (
    <>
      <PageHeading
        title="Admin users"
        description={`${rows.length} ${rows.length === 1 ? 'account' : 'accounts'} with elevated access.`}
      />

      <Alert variant="info" className="mb-6" title="Granting admin access">
        Promote an existing account from{' '}
        <strong>Customers</strong> — there is no separate admin sign-up. Every
        role change is written to the audit log, and the last active super admin
        cannot be demoted.
      </Alert>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        empty={{
          title: 'No admin users',
          description: 'Promote a customer account to grant admin access.',
        }}
      />
    </>
  );
}
