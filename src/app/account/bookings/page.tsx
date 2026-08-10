import type { Metadata } from 'next';
import Link from 'next/link';
import { requireUserPage } from '@/lib/firebase/auth';
import { listUserBookings } from '@/services/booking.service';
import { paginationSchema } from '@/lib/validation/common.schema';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { ButtonLink } from '@/components/ui/Button';
import { formatDate, formatPrice } from '@/lib/utils';
import type { BookingDTO } from '@/types';

export const metadata: Metadata = {
  title: 'My bookings',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AccountBookingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUserPage('/account/bookings');
  const raw = await searchParams;
  const parsed = paginationSchema.safeParse(raw);
  const { page, limit } = parsed.success ? parsed.data : paginationSchema.parse({});

  // Scoped to the session user; the service applies the userId filter.
  const { bookings, total } = await listUserBookings(String(user._id), page, limit);
  const totalPages = Math.ceil(total / limit);

  const columns: Column<BookingDTO>[] = [
    {
      key: 'package',
      header: 'Package',
      render: (booking) => (
        <Link
          href={`/account/bookings/${booking.id}`}
          className="font-medium text-sand-900 underline-offset-4 hover:underline"
        >
          {booking.packageRef.title}
        </Link>
      ),
    },
    {
      key: 'reference',
      header: 'Reference',
      render: (booking) => (
        <span className="font-mono text-xs text-sand-600">
          {booking.bookingReference}
        </span>
      ),
    },
    {
      key: 'travelDate',
      header: 'Travel date',
      render: (booking) => formatDate(booking.travelDate),
    },
    {
      key: 'travellers',
      header: 'Travellers',
      secondary: true,
      render: (booking) => booking.travellers.length,
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
        <div className="flex flex-wrap justify-end gap-1.5">
          <StatusBadge.Booking status={booking.status} />
          <StatusBadge.Payment status={booking.paymentStatus} />
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-sand-900">My bookings</h1>
        <p className="mt-1 text-sm text-sand-600">
          {total} {total === 1 ? 'booking' : 'bookings'} on your account.
        </p>
      </div>

      <DataTable
        columns={columns}
        rows={bookings}
        rowKey={(booking) => booking.id}
        empty={{
          title: 'No bookings yet',
          description:
            'When you book a tour package it will appear here, with its reference and current status.',
          action: <ButtonLink href="/tours">Browse packages</ButtonLink>,
        }}
      />

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          buildHref={(target) =>
            target > 1 ? `/account/bookings?page=${target}` : '/account/bookings'
          }
        />
      )}
    </div>
  );
}
