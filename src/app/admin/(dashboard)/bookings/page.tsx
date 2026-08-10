import type { Metadata } from 'next';
import { requireAdminPage } from '@/lib/firebase/auth';
import { listBookingsForAdmin } from '@/services/booking.service';
import { bookingListQuerySchema } from '@/lib/validation/booking.schema';
import { PageHeading } from '@/components/admin/PageHeading';
import { SearchFilters } from '@/components/ui/SearchFilters';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { BookingStatusControls } from '@/components/admin/BookingStatusControls';
import { formatDate, formatPrice } from '@/lib/utils';
import { BOOKING_STATUSES, PAYMENT_STATUSES } from '@/constants';
import type { BookingDTO } from '@/types';

export const metadata: Metadata = {
  title: 'Bookings',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const label = (value: string) =>
  value.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase());

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPage('/admin/bookings');

  const raw = await searchParams;
  const parsed = bookingListQuerySchema.safeParse(raw);
  const query = parsed.success ? parsed.data : bookingListQuerySchema.parse({});

  const { bookings, total } = await listBookingsForAdmin(query);
  const totalPages = Math.ceil(total / query.limit);

  const columns: Column<BookingDTO>[] = [
    {
      key: 'reference',
      header: 'Reference',
      render: (booking) => (
        <span className="font-mono text-xs font-medium text-sand-900">
          {booking.bookingReference}
        </span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (booking) => (
        <div className="min-w-0">
          <p className="font-medium text-sand-900">{booking.contact.name}</p>
          <p className="truncate text-xs text-sand-500">{booking.contact.email}</p>
        </div>
      ),
    },
    {
      key: 'package',
      header: 'Package',
      render: (booking) => (
        <span className="text-sm">{booking.packageRef.title}</span>
      ),
    },
    {
      key: 'travelDate',
      header: 'Travel date',
      secondary: true,
      render: (booking) => formatDate(booking.travelDate),
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (booking) => (
        <span className="font-medium text-sand-900">
          {formatPrice(booking.pricingSnapshot.total)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      render: (booking) => (
        <BookingStatusControls
          bookingId={booking.id}
          status={booking.status}
          paymentStatus={booking.paymentStatus}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeading
        title="Bookings"
        description={`${total} ${total === 1 ? 'booking' : 'bookings'} in total.`}
      />

      <SearchFilters
        className="mb-6"
        placeholder="Search reference, customer or package…"
        filters={[
          {
            name: 'status',
            label: 'All statuses',
            options: BOOKING_STATUSES.map((status) => ({
              value: status,
              label: label(status),
            })),
          },
          {
            name: 'paymentStatus',
            label: 'All payments',
            options: PAYMENT_STATUSES.map((status) => ({
              value: status,
              label: label(status),
            })),
          },
        ]}
      />

      <DataTable
        columns={columns}
        rows={bookings}
        rowKey={(booking) => booking.id}
        empty={{
          title: 'No bookings found',
          description: 'Nothing matches these filters. Clear them to see every booking.',
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
            return qs ? `/admin/bookings?${qs}` : '/admin/bookings';
          }}
        />
      )}
    </>
  );
}
