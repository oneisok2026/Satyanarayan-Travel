import type { Metadata } from 'next';
import { requireUserPage } from '@/lib/firebase/auth';
import { connectToDatabase } from '@/lib/db/connect';
import { Booking } from '@/models/Booking';
import { TourPackage } from '@/models/TourPackage';
import { ButtonLink } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'My downloads',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface DownloadRow {
  id: string;
  title: string;
  url: string;
  bookingReference: string;
  addedAt: string;
}

/**
 * Brochures for packages the customer has booked.
 *
 * Derived from bookings rather than stored separately: a download is
 * available because you booked the package, so there is nothing to keep in
 * sync.
 */
export default async function AccountDownloadsPage() {
  const user = await requireUserPage('/account/downloads');

  await connectToDatabase();

  const bookings = await Booking.find({ userId: user._id })
    .select('packageId packageTitle bookingReference createdAt')
    .sort({ createdAt: -1 })
    .lean();

  const packageIds = [...new Set(bookings.map((booking) => String(booking.packageId)))];

  const packages = await TourPackage.find({
    _id: { $in: packageIds },
    brochureUrl: { $exists: true, $ne: '' },
  })
    .select('brochureUrl title')
    .lean();

  const brochureByPackage = new Map(
    packages.map((pkg) => [String(pkg._id), pkg.brochureUrl as string]),
  );

  // One row per booking that has a brochure, newest first.
  const seen = new Set<string>();
  const downloads: DownloadRow[] = [];

  for (const booking of bookings) {
    const key = String(booking.packageId);
    const url = brochureByPackage.get(key);
    if (!url || seen.has(key)) continue;
    seen.add(key);
    downloads.push({
      id: String(booking._id),
      title: booking.packageTitle,
      url,
      bookingReference: booking.bookingReference,
      addedAt: booking.createdAt.toISOString(),
    });
  }

  const columns: Column<DownloadRow>[] = [
    {
      key: 'title',
      header: 'Document',
      render: (row) => (
        <span className="font-medium text-sand-900">{row.title} — itinerary</span>
      ),
    },
    {
      key: 'booking',
      header: 'Booking',
      secondary: true,
      render: (row) => (
        <span className="font-mono text-xs text-sand-600">{row.bookingReference}</span>
      ),
    },
    {
      key: 'added',
      header: 'Available since',
      secondary: true,
      render: (row) => formatDate(row.addedAt),
    },
    {
      key: 'download',
      header: 'Download',
      align: 'right',
      render: (row) => (
        <a
          href={row.url}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 underline-offset-4 hover:underline"
        >
          <svg
            className="size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          PDF
        </a>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-sand-900">
          My downloads
        </h1>
        <p className="mt-1 text-sm text-sand-600">
          Itineraries and brochures for the packages you have booked.
        </p>
      </div>

      <DataTable
        columns={columns}
        rows={downloads}
        rowKey={(row) => row.id}
        empty={{
          title: 'No downloads yet',
          description:
            'Once you book a package, its itinerary and brochure appear here for download.',
          action: <ButtonLink href="/tours">Browse packages</ButtonLink>,
        }}
      />
    </div>
  );
}
