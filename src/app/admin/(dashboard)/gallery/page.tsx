import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { z } from 'zod';
import { requireAdminPage } from '@/lib/firebase/auth';
import { connectToDatabase } from '@/lib/db/connect';
import { GalleryItem } from '@/models/GalleryItem';
import { paginationSchema, offsetFor } from '@/lib/validation/common.schema';
import { PageHeading } from '@/components/admin/PageHeading';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { cn, slugify } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Gallery',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const querySchema = paginationSchema.extend({
  album: z.string().trim().max(160).optional(),
});

export default async function AdminGalleryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPage('/admin/gallery');

  const raw = await searchParams;
  const parsed = querySchema.safeParse(raw);
  const query = parsed.success ? parsed.data : querySchema.parse({});

  await connectToDatabase();

  const filter = query.album ? { albumSlug: query.album } : {};

  const [items, total, albums] = await Promise.all([
    GalleryItem.find(filter)
      .sort({ albumSlug: 1, sortOrder: 1 })
      .skip(offsetFor(query.page, query.limit))
      .limit(query.limit)
      .lean(),
    GalleryItem.countDocuments(filter),
    GalleryItem.distinct('album'),
  ]);

  const totalPages = Math.ceil(total / query.limit);

  return (
    <>
      <PageHeading
        title="Gallery"
        description={`${total} ${total === 1 ? 'image' : 'images'} across ${albums.length} ${albums.length === 1 ? 'album' : 'albums'}.`}
      />

      {albums.length > 0 && (
        <nav aria-label="Filter by album" className="mb-6 flex flex-wrap gap-2">
          <Link
            href="/admin/gallery"
            aria-current={!query.album ? 'page' : undefined}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition-colors',
              !query.album
                ? 'bg-brand-700 text-white'
                : 'bg-white text-sand-700 ring-1 ring-sand-200 hover:bg-sand-50',
            )}
          >
            All albums
          </Link>
          {(albums as string[]).map((album) => {
            const albumSlug = slugify(album);
            return (
              <Link
                key={album}
                href={`/admin/gallery?album=${albumSlug}`}
                aria-current={query.album === albumSlug ? 'page' : undefined}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  query.album === albumSlug
                    ? 'bg-brand-700 text-white'
                    : 'bg-white text-sand-700 ring-1 ring-sand-200 hover:bg-sand-50',
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
          title="No images found"
          description="Gallery images appear here once added to an album."
        />
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <li
              key={String(item._id)}
              className="overflow-hidden rounded-xl bg-white ring-1 ring-sand-200"
            >
              <div className="relative aspect-square bg-sand-200">
                <Image
                  src={item.image.url}
                  alt={item.image.alt || item.caption || 'Gallery image'}
                  fill
                  sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
                  loading="lazy"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col gap-1.5 p-3">
                <p className="truncate text-xs font-medium text-sand-900">
                  {item.caption || item.album}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[0.6875rem] text-sand-500">
                    {item.album}
                  </span>
                  <StatusBadge.Content status={item.status} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <Pagination
          className="mt-8"
          page={query.page}
          totalPages={totalPages}
          buildHref={(target) => {
            const params = new URLSearchParams();
            if (query.album) params.set('album', query.album);
            if (target > 1) params.set('page', String(target));
            const qs = params.toString();
            return qs ? `/admin/gallery?${qs}` : '/admin/gallery';
          }}
        />
      )}
    </>
  );
}
