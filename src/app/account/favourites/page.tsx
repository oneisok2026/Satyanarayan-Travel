import type { Metadata } from 'next';
import { requireUserPage } from '@/lib/firebase/auth';
import { connectToDatabase } from '@/lib/db/connect';
import { Favourite } from '@/models/Favourite';
import { toPackageSummaryDTO } from '@/services/mappers';
import { PackageCard } from '@/components/tours/PackageCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ButtonLink } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'My favourites',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const SUMMARY_FIELDS =
  'title slug type destinationIds categoryId shortDescription coverImage duration price compareAtPrice priceNote featured rating';

export default async function AccountFavouritesPage() {
  const user = await requireUserPage('/account/favourites');

  await connectToDatabase();

  const favourites = await Favourite.find({ userId: user._id })
    .populate({
      path: 'packageId',
      select: SUMMARY_FIELDS,
      populate: [
        { path: 'destinationIds', select: 'name slug' },
        { path: 'categoryId', select: 'name slug' },
      ],
    })
    .sort({ createdAt: -1 })
    .lean();

  // A package deleted after being favourited leaves a dangling reference.
  const packages = favourites
    .filter((favourite) => isPopulated(favourite.packageId))
    .map((favourite) => toPackageSummaryDTO(favourite.packageId as unknown as object));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-sand-900">
          My favourites
        </h1>
        <p className="mt-1 text-sm text-sand-600">
          {packages.length} saved {packages.length === 1 ? 'package' : 'packages'}.
        </p>
      </div>

      {packages.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          description="Save packages you are considering and they will be waiting here when you return."
          action={<ButtonLink href="/tours">Browse packages</ButtonLink>}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {packages.map((pkg) => (
            <PackageCard key={pkg.id} package={pkg} />
          ))}
        </div>
      )}
    </div>
  );
}

function isPopulated(value: unknown): boolean {
  return value != null && typeof value === 'object' && 'slug' in value;
}
