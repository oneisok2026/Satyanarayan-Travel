import type { Metadata } from 'next';
import Link from 'next/link';
import { requireUserPage } from '@/lib/firebase/auth';
import { VerifyEmailNotice } from '@/components/account/VerifyEmailNotice';
import { listUserBookings } from '@/services/booking.service';
import { listUserEnquiries } from '@/services/enquiry.service';
import { connectToDatabase } from '@/lib/db/connect';
import { Favourite } from '@/models/Favourite';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ButtonLink } from '@/components/ui/Button';
import { formatDate, formatPrice } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'My account',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const user = await requireUserPage('/account');
  const userId = String(user._id);

  await connectToDatabase();

  // Counts and recent rows in one round of parallel queries.
  const [bookings, enquiries, favouriteCount] = await Promise.all([
    listUserBookings(userId, 1, 3),
    listUserEnquiries(userId, 1, 3),
    Favourite.countDocuments({ userId: user._id }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-sand-900">
          Welcome back, {user.name.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-sand-600">
          Track your enquiries, bookings and saved packages here.
        </p>
      </div>

      {!user.emailVerified && <VerifyEmailNotice email={user.email} />}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Bookings"
          value={bookings.total}
          href="/account/bookings"
        />
        <StatCard
          label="Enquiries"
          value={enquiries.total}
          href="/account/enquiries"
        />
        <StatCard
          label="Favourites"
          value={favouriteCount}
          href="/account/favourites"
        />
      </div>

      <section aria-labelledby="recent-bookings">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="recent-bookings" className="font-display text-lg font-semibold text-sand-900">
            Recent bookings
          </h2>
          {bookings.total > 0 && (
            <Link
              href="/account/bookings"
              className="text-sm font-medium text-brand-700 underline-offset-4 hover:underline"
            >
              View all
            </Link>
          )}
        </div>

        {bookings.bookings.length === 0 ? (
          <EmptyState
            title="No bookings yet"
            description="When you book a package it will appear here with its status and reference."
            action={<ButtonLink href="/tours">Browse packages</ButtonLink>}
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {bookings.bookings.map((booking) => (
              <li
                key={booking.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 ring-1 ring-sand-200"
              >
                <div className="min-w-0">
                  <Link
                    href={`/account/bookings/${booking.id}`}
                    className="font-medium text-sand-900 underline-offset-4 hover:underline"
                  >
                    {booking.packageRef.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-sand-500">
                    {booking.bookingReference} · {formatDate(booking.travelDate)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-sand-900">
                    {formatPrice(booking.pricingSnapshot.total)}
                  </span>
                  <StatusBadge.Booking status={booking.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="recent-enquiries">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="recent-enquiries" className="font-display text-lg font-semibold text-sand-900">
            Recent enquiries
          </h2>
          {enquiries.total > 0 && (
            <Link
              href="/account/enquiries"
              className="text-sm font-medium text-brand-700 underline-offset-4 hover:underline"
            >
              View all
            </Link>
          )}
        </div>

        {enquiries.enquiries.length === 0 ? (
          <EmptyState
            title="No enquiries yet"
            description="Send us an enquiry and we will reply within one working day."
            action={<ButtonLink href="/contact">Send an enquiry</ButtonLink>}
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {enquiries.enquiries.map((enquiry) => (
              <li
                key={enquiry.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 ring-1 ring-sand-200"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-sand-900">
                    {enquiry.packageRef?.title ?? 'General enquiry'}
                  </p>
                  <p className="mt-0.5 text-xs text-sand-500">
                    {enquiry.referenceCode} · {formatDate(enquiry.createdAt)}
                  </p>
                </div>
                <StatusBadge.Enquiry status={enquiry.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl bg-white p-5 ring-1 ring-sand-200 transition-shadow hover:shadow-[var(--shadow-card)]"
    >
      <p className="text-sm text-sand-600">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold text-sand-900">{value}</p>
    </Link>
  );
}
