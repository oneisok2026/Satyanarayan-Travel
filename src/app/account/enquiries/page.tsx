import type { Metadata } from 'next';
import Link from 'next/link';
import { requireUserPage } from '@/lib/firebase/auth';
import { listUserEnquiries } from '@/services/enquiry.service';
import { paginationSchema } from '@/lib/validation/common.schema';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { ButtonLink } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import type { EnquiryDTO } from '@/types';

export const metadata: Metadata = {
  title: 'My enquiries',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const TYPE_LABELS: Record<string, string> = {
  general: 'General',
  package: 'Package',
  hotel: 'Hotel booking',
  car_rental: 'Car rental',
  eticket: 'E-ticket',
  bus_rental: 'Car/Bus rental',
  railway: 'Railway ticket',
  flight: 'Flight ticket',
  contact: 'Contact',
};

export default async function AccountEnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUserPage('/account/enquiries');
  const raw = await searchParams;
  const parsed = paginationSchema.safeParse(raw);
  const { page, limit } = parsed.success ? parsed.data : paginationSchema.parse({});

  const { enquiries, total } = await listUserEnquiries(String(user._id), page, limit);
  const totalPages = Math.ceil(total / limit);

  const columns: Column<EnquiryDTO>[] = [
    {
      key: 'subject',
      header: 'Enquiry',
      render: (enquiry) =>
        enquiry.packageRef ? (
          <Link
            href={`/packages/${enquiry.packageRef.slug}`}
            className="font-medium text-sand-900 underline-offset-4 hover:underline"
          >
            {enquiry.packageRef.title}
          </Link>
        ) : (
          <span className="font-medium text-sand-900">
            {TYPE_LABELS[enquiry.type] ?? 'Enquiry'}
          </span>
        ),
    },
    {
      key: 'reference',
      header: 'Reference',
      render: (enquiry) => (
        <span className="font-mono text-xs text-sand-600">{enquiry.referenceCode}</span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      secondary: true,
      render: (enquiry) => TYPE_LABELS[enquiry.type] ?? enquiry.type,
    },
    {
      key: 'travelDate',
      header: 'Travel date',
      secondary: true,
      render: (enquiry) =>
        enquiry.travelDate ? formatDate(enquiry.travelDate) : '—',
    },
    {
      key: 'sent',
      header: 'Sent',
      render: (enquiry) => formatDate(enquiry.createdAt),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      render: (enquiry) => <StatusBadge.Enquiry status={enquiry.status} />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-sand-900">
          My enquiries
        </h1>
        <p className="mt-1 text-sm text-sand-600">
          {total} {total === 1 ? 'enquiry' : 'enquiries'} on your account.
        </p>
      </div>

      <DataTable
        columns={columns}
        rows={enquiries}
        rowKey={(enquiry) => enquiry.id}
        empty={{
          title: 'No enquiries yet',
          description:
            'Enquiries you send while signed in appear here, so you can track our replies.',
          action: <ButtonLink href="/contact">Send an enquiry</ButtonLink>,
        }}
      />

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          buildHref={(target) =>
            target > 1 ? `/account/enquiries?page=${target}` : '/account/enquiries'
          }
        />
      )}
    </div>
  );
}
