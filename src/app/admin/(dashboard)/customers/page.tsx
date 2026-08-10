import type { Metadata } from 'next';
import { z } from 'zod';
import { requireAdminPage } from '@/lib/firebase/auth';
import { listCustomers } from '@/services/admin.service';
import { paginationSchema } from '@/lib/validation/common.schema';
import { PageHeading } from '@/components/admin/PageHeading';
import { SearchFilters } from '@/components/ui/SearchFilters';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { CustomerActions } from '@/components/admin/CustomerActions';
import { formatDate } from '@/lib/utils';
import { USER_ROLES, USER_STATUSES } from '@/constants';

export const metadata: Metadata = {
  title: 'Customers',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const querySchema = paginationSchema.extend({
  search: z.string().trim().max(80).optional(),
  role: z.enum(USER_ROLES).optional(),
  status: z.enum(USER_STATUSES).optional(),
});

interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt?: string;
}

const label = (value: string) =>
  value.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase());

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdminPage('/admin/customers');

  const raw = await searchParams;
  const parsed = querySchema.safeParse(raw);
  const query = parsed.success ? parsed.data : querySchema.parse({});

  const { customers, total } = await listCustomers(query);
  const totalPages = Math.ceil(total / query.limit);

  const columns: Column<CustomerRow>[] = [
    {
      key: 'name',
      header: 'Customer',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-sand-900">{row.name}</p>
          <p className="truncate text-xs text-sand-500">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      secondary: true,
      render: (row) => row.phone ?? '—',
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) => (
        <Badge tone={row.role === 'customer' ? 'neutral' : 'brand'}>
          {label(row.role)}
        </Badge>
      ),
    },
    {
      key: 'joined',
      header: 'Joined',
      secondary: true,
      render: (row) => formatDate(row.createdAt),
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
          // Self-targeting is blocked server-side too; this hides the control.
          isSelf={row.id === String(admin._id)}
          canChangeRole={admin.role === 'super_admin'}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeading
        title="Customers"
        description={`${total} ${total === 1 ? 'account' : 'accounts'} registered.`}
      />

      <SearchFilters
        className="mb-6"
        placeholder="Search name, email or phone…"
        filters={[
          {
            name: 'role',
            label: 'All roles',
            options: USER_ROLES.map((role) => ({ value: role, label: label(role) })),
          },
          {
            name: 'status',
            label: 'All statuses',
            options: USER_STATUSES.map((status) => ({
              value: status,
              label: label(status),
            })),
          },
        ]}
      />

      <DataTable
        columns={columns}
        rows={customers}
        rowKey={(row) => row.id}
        empty={{
          title: 'No customers found',
          description: 'Nothing matches these filters. Clear them to see every account.',
        }}
      />

      {totalPages > 1 && (
        <Pagination
          className="mt-8"
          page={query.page}
          totalPages={totalPages}
          buildHref={(target) => {
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(raw)) {
              if (typeof value === 'string' && key !== 'page') params.set(key, value);
            }
            if (target > 1) params.set('page', String(target));
            const qs = params.toString();
            return qs ? `/admin/customers?${qs}` : '/admin/customers';
          }}
        />
      )}
    </>
  );
}
