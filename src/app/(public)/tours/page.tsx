import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHero } from '@/components/layout/PageHero';
import { PackageGrid } from '@/components/tours/PackageGrid';
import { PackageFilters } from '@/components/tours/PackageFilters';
import { Pagination } from '@/components/ui/Pagination';
import { CardGridSkeleton } from '@/components/ui/Skeleton';
import { listPublishedPackages } from '@/services/package.service';
import {
  listPublishedDestinations,
  listPublishedCategories,
} from '@/services/destination.service';
import { packageListQuerySchema } from '@/lib/validation/catalog.schema';

export const revalidate = 300; // packages

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const metadata: Metadata = {
  title: 'Tour Packages',
  description:
    'Browse domestic and international tour packages with day-wise itineraries, inclusions and transparent pricing.',
  alternates: { canonical: '/tours' },
};

export default async function ToursPage({ searchParams }: PageProps) {
  return (
    <>
      <PageHero
        eyebrow="Tour packages"
        title="Every journey, costed and ready"
        description="Filter by destination, trip type, budget or duration. Every package can be tailored to your dates."
        crumbs={[{ href: '/tours', label: 'Tours' }]}
        image={{
          url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1800&q=70',
          alt: '',
        }}
      />

      <div className="container-page py-12 lg:py-16">
        <Suspense fallback={<CardGridSkeleton count={9} />}>
          <PackageResults searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

/** Split out so Suspense can stream the grid while filters render immediately. */
async function PackageResults({ searchParams }: PageProps) {
  const raw = await searchParams;

  // Invalid query strings fall back to defaults rather than 500ing.
  const parsed = packageListQuerySchema.safeParse(raw);
  const query = parsed.success ? parsed.data : packageListQuerySchema.parse({});

  const [result, destinations, categories] = await Promise.all([
    listPublishedPackages({
      type: query.type,
      destinationSlug: query.destination,
      categorySlug: query.category,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      minNights: query.minNights,
      maxNights: query.maxNights,
      search: query.search,
      sort: query.sort,
      page: query.page,
      limit: query.limit,
    }),
    listPublishedDestinations({ page: 1, limit: 60 }),
    listPublishedCategories(),
  ]);

  const totalPages = Math.ceil(result.total / query.limit);

  return (
    <>
      <PackageFilters destinations={destinations.destinations} categories={categories} />

      <p className="mt-6 mb-8 text-sm text-sand-600" role="status">
        {result.total} {result.total === 1 ? 'package' : 'packages'} available
      </p>

      <PackageGrid packages={result.packages} />

      {totalPages > 1 && (
        <Pagination
          className="mt-12"
          page={query.page}
          totalPages={totalPages}
          buildHref={(page) => {
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(raw)) {
              if (typeof value === 'string' && key !== 'page') params.set(key, value);
            }
            if (page > 1) params.set('page', String(page));
            const qs = params.toString();
            return qs ? `/tours?${qs}` : '/tours';
          }}
        />
      )}
    </>
  );
}
