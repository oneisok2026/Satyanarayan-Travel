import type { Metadata } from 'next';
import Image from 'next/image';
import { requireAdminPage } from '@/lib/firebase/auth';
import { connectToDatabase } from '@/lib/db/connect';
import { HeroSlide } from '@/models/HeroSlide';
import { PageHeading } from '@/components/admin/PageHeading';
import { NewItemButton } from '@/components/admin/NewItemButton';
import { CatalogueRowActions } from '@/components/admin/CatalogueRowActions';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert } from '@/components/ui/Alert';

export const metadata: Metadata = {
  title: 'Hero slides',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/**
 * Homepage hero slides.
 *
 * Ordered exactly as the homepage renders them, so the list doubles as a
 * preview of the rotation. Published slides appear on the site; anything else
 * is held back without being deleted.
 */
export default async function AdminHeroSlidesPage() {
  const admin = await requireAdminPage('/admin/hero-slides');

  await connectToDatabase();

  const slides = await HeroSlide.find({})
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();

  const published = slides.filter((slide) => slide.status === 'published').length;

  return (
    <>
      <PageHeading
        title="Hero slides"
        description={`${slides.length} ${slides.length === 1 ? 'slide' : 'slides'} · ${published} live on the homepage.`}
        action={
          admin.role === 'super_admin' ? (
            <NewItemButton href="/admin/hero-slides/new" label="New slide" />
          ) : undefined
        }
      />

      {published === 0 && slides.length > 0 && (
        <Alert variant="warning" className="mb-6" title="No slides are live">
          The homepage falls back to its built-in image until at least one slide
          is published.
        </Alert>
      )}

      {slides.length === 0 ? (
        <EmptyState
          title="No hero slides yet"
          description="Add a slide to control the homepage banner image and its text. Until then the homepage uses its built-in image."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {slides.map((slide) => (
            <li
              key={String(slide._id)}
              className="flex flex-col gap-4 rounded-2xl bg-white p-4 ring-1 ring-sand-200 sm:flex-row sm:items-center"
            >
              <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-xl bg-sand-200 sm:aspect-[3/2] sm:w-40">
                <Image
                  src={slide.image.url}
                  alt={slide.image.alt || slide.headline}
                  fill
                  sizes="160px"
                  loading="lazy"
                  className="object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                {slide.eyebrow && (
                  <p className="text-[0.6875rem] font-medium tracking-wide text-sand-500 uppercase">
                    {slide.eyebrow}
                  </p>
                )}
                <p className="font-medium text-sand-900">
                  {slide.headline}
                  {slide.headlineAccent && (
                    <span className="text-accent-600"> {slide.headlineAccent}</span>
                  )}
                </p>
                {slide.subheadline && (
                  <p className="mt-0.5 line-clamp-2 text-sm text-sand-600">
                    {slide.subheadline}
                  </p>
                )}
                <p className="mt-1 text-xs text-sand-400">Order {slide.sortOrder}</p>
              </div>

              <CatalogueRowActions
                resource="hero-slides"
                id={String(slide._id)}
                title={slide.headline}
                status={slide.status}
                canManage={admin.role === 'super_admin'}
                editHref={`/admin/hero-slides/${String(slide._id)}`}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
