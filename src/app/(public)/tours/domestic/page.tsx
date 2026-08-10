import type { Metadata } from 'next';
import { PageHero } from '@/components/layout/PageHero';
import { PackageGrid } from '@/components/tours/PackageGrid';
import { Pagination } from '@/components/ui/Pagination';
import { listPublishedPackages } from '@/services/package.service';
import { paginationSchema } from '@/lib/validation/common.schema';

export const revalidate = 300; // packages

export const metadata: Metadata = {
  title: 'Domestic Tour Packages in India',
  description:
    'Holiday packages across India — Kashmir, Kerala, Rajasthan, Himachal, Goa and the Andaman Islands, with day-wise itineraries and transparent pricing.',
  alternates: { canonical: '/tours/domestic' },
};

export default async function DomesticToursPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const parsed = paginationSchema.safeParse(raw);
  const { page, limit } = parsed.success ? parsed.data : paginationSchema.parse({});

  const { packages, total } = await listPublishedPackages({
    type: 'domestic',
    page,
    limit,
  });

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <PageHero
        eyebrow="Within India"
        title="Domestic tour packages"
        description="From Himalayan valleys and desert forts to southern backwaters and island beaches — planned around Indian holidays and travel patterns."
        crumbs={[
          { href: '/tours', label: 'Tours' },
          { href: '/tours/domestic', label: 'Domestic' },
        ]}
        image={{
          url: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1800&q=70',
          alt: '',
        }}
      />

      <div className="container-page py-12 lg:py-16">
        <p className="mb-8 text-sm text-sand-600" role="status">
          {total} {total === 1 ? 'package' : 'packages'} available
        </p>

        <PackageGrid packages={packages} />

        {totalPages > 1 && (
          <Pagination
            className="mt-12"
            page={page}
            totalPages={totalPages}
            buildHref={(target) =>
              target > 1 ? `/tours/domestic?page=${target}` : '/tours/domestic'
            }
          />
        )}
      </div>
    </>
  );
}
