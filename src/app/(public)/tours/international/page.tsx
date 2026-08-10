import type { Metadata } from 'next';
import { PageHero } from '@/components/layout/PageHero';
import { PackageGrid } from '@/components/tours/PackageGrid';
import { Pagination } from '@/components/ui/Pagination';
import { listPublishedPackages } from '@/services/package.service';
import { paginationSchema } from '@/lib/validation/common.schema';

export const revalidate = 300; // packages

export const metadata: Metadata = {
  title: 'International Tour Packages',
  description:
    'International holiday packages to Thailand, Dubai, Singapore and Bali — with visa guidance, airport transfers and local support included.',
  alternates: { canonical: '/tours/international' },
};

export default async function InternationalToursPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const parsed = paginationSchema.safeParse(raw);
  const { page, limit } = parsed.success ? parsed.data : paginationSchema.parse({});

  const { packages, total } = await listPublishedPackages({
    type: 'international',
    page,
    limit,
  });

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <PageHero
        eyebrow="Beyond India"
        title="International tour packages"
        description="Visa guidance, airport transfers and on-ground support included — so a first trip abroad feels as easy as a domestic one."
        crumbs={[
          { href: '/tours', label: 'Tours' },
          { href: '/tours/international', label: 'International' },
        ]}
        image={{
          url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1800&q=70',
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
              target > 1
                ? `/tours/international?page=${target}`
                : '/tours/international'
            }
          />
        )}
      </div>
    </>
  );
}
