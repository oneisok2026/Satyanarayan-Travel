import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/layout/PageHero';
import { GalleryGrid } from '@/components/gallery/GalleryGrid';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { listGalleryItems } from '@/services/content.service';
import { galleryListQuerySchema } from '@/lib/validation/catalog.schema';
import { cn, slugify } from '@/lib/utils';

export const revalidate = 900; // gallery

export const metadata: Metadata = {
  title: 'Gallery',
  description:
    'Photographs from the journeys we plan — destinations, stays and moments from our travellers.',
  alternates: { canonical: '/gallery' },
};

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const parsed = galleryListQuerySchema.safeParse(raw);
  const query = parsed.success ? parsed.data : galleryListQuerySchema.parse({});

  const { items, total, albums } = await listGalleryItems(
    query.album,
    query.page,
    24,
  );

  const totalPages = Math.ceil(total / 24);

  return (
    <>
      <PageHero
        eyebrow="Travel moments"
        title="Gallery"
        description="Photographs from the destinations we cover and the trips we have run."
        crumbs={[{ href: '/gallery', label: 'Gallery' }]}
        image={{
          url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1800&q=70',
          alt: '',
        }}
      />

      <div className="container-page py-12 lg:py-16">
        {albums.length > 0 && (
          <nav aria-label="Gallery albums" className="mb-8 flex flex-wrap gap-2">
            <Link
              href="/gallery"
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                !query.album
                  ? 'bg-brand-700 text-white'
                  : 'bg-white text-sand-700 ring-1 ring-sand-200 hover:bg-sand-100',
              )}
            >
              All photos
            </Link>
            {albums.map((album) => {
              const albumSlug = slugify(album);
              return (
                <Link
                  key={album}
                  href={`/gallery?album=${albumSlug}`}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    query.album === albumSlug
                      ? 'bg-brand-700 text-white'
                      : 'bg-white text-sand-700 ring-1 ring-sand-200 hover:bg-sand-100',
                  )}
                >
                  {album}
                </Link>
              );
            })}
          </nav>
        )}

        {items.length === 0 ? (
          <EmptyState
            title="No photographs yet"
            description="We are building this gallery. Check back soon."
          />
        ) : (
          <>
            {/* First eight images are above the fold on most viewports */}
            <GalleryGrid items={items} eagerCount={4} />

            {totalPages > 1 && (
              <Pagination
                className="mt-12"
                page={query.page}
                totalPages={totalPages}
                buildHref={(page) => {
                  const params = new URLSearchParams();
                  if (query.album) params.set('album', query.album);
                  if (page > 1) params.set('page', String(page));
                  const qs = params.toString();
                  return qs ? `/gallery?${qs}` : '/gallery';
                }}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}
