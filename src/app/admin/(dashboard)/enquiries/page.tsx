import type { Metadata } from 'next';
import { requireAdminPage } from '@/lib/firebase/auth';
import { listEnquiriesForAdmin } from '@/services/enquiry.service';
import { enquiryListQuerySchema } from '@/lib/validation/enquiry.schema';
import { PageHeading } from '@/components/admin/PageHeading';
import { SearchFilters } from '@/components/ui/SearchFilters';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { EnquiryStatusSelect } from '@/components/admin/EnquiryStatusSelect';
import { formatDate } from '@/lib/utils';
import { ENQUIRY_STATUSES, ENQUIRY_TYPES } from '@/constants';
import type { EnquiryDTO } from '@/types';

export const metadata: Metadata = {
  title: 'Enquiries',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const TYPE_LABELS: Record<string, string> = {
  general: 'General',
  package: 'Package',
  hotel: 'Hotel',
  car_rental: 'Car rental',
  eticket: 'E-ticket',
  contact: 'Contact',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  follow_up: 'Follow up',
  quoted: 'Quoted',
  confirmed: 'Confirmed',
  closed: 'Closed',
};

export default async function AdminEnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPage('/admin/enquiries');

  const raw = await searchParams;
  const parsed = enquiryListQuerySchema.safeParse(raw);
  const query = parsed.success ? parsed.data : enquiryListQuerySchema.parse({});

  const { enquiries, total } = await listEnquiriesForAdmin(query);
  const totalPages = Math.ceil(total / query.limit);

  const columns: Column<EnquiryDTO>[] = [
    {
      key: 'contact',
      header: 'Customer',
      render: (enquiry) => (
        <div className="min-w-0">
          <p className="font-medium text-sand-900">{enquiry.name}</p>
          <p className="truncate text-xs text-sand-500">{enquiry.email}</p>
        </div>
      ),
    },
    {
      key: 'reference',
      header: 'Reference',
      secondary: true,
      render: (enquiry) => (
        <span className="font-mono text-xs text-sand-600">{enquiry.referenceCode}</span>
      ),
    },
    {
      key: 'subject',
      header: 'Interest',
      render: (enquiry) => (
        <span className="text-sm">
          {enquiry.packageRef?.title ?? TYPE_LABELS[enquiry.type] ?? enquiry.type}
        </span>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      secondary: true,
      render: (enquiry) => (
        <a
          href={`tel:${enquiry.phone}`}
          className="text-brand-700 underline-offset-4 hover:underline"
        >
          {enquiry.phone}
        </a>
      ),
    },
    {
      key: 'received',
      header: 'Received',
      render: (enquiry) => formatDate(enquiry.createdAt),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      render: (enquiry) => (
        <EnquiryStatusSelect enquiryId={enquiry.id} status={enquiry.status} />
      ),
    },
  ];

  return (
    <>
      <PageHeading
        title="Enquiries"
        description={`${total} ${total === 1 ? 'enquiry' : 'enquiries'} received.`}
      />

      <SearchFilters
        className="mb-6"
        placeholder="Search name, email, phone or reference…"
        filters={[
          {
            name: 'status',
            label: 'All statuses',
            options: ENQUIRY_STATUSES.map((status) => ({
              value: status,
              label: STATUS_LABELS[status] ?? status,
            })),
          },
          {
            name: 'type',
            label: 'All types',
            options: ENQUIRY_TYPES.map((type) => ({
              value: type,
              label: TYPE_LABELS[type] ?? type,
            })),
          },
        ]}
      />

      <DataTable
        columns={columns}
        rows={enquiries}
        rowKey={(enquiry) => enquiry.id}
        empty={{
          title: 'No enquiries found',
          description:
            'Nothing matches these filters. Clear them to see every enquiry.',
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
            return qs ? `/admin/enquiries?${qs}` : '/admin/enquiries';
          }}
        />
      )}
    </>
  );
}
