import Image from 'next/image';
import Link from 'next/link';
import { cn, formatPrice, formatDuration } from '@/lib/utils';
import { Rating } from '@/components/ui/Rating';
import { BookNowButton } from './BookNowButton';
import type { TourPackageSummaryDTO } from '@/types';

interface PackageCardProps {
  package: TourPackageSummaryDTO;
  /** Set for above-the-fold cards so their image is not lazy-loaded. */
  priority?: boolean;
  className?: string;
}

/**
 * Package listing card. Server Component — no client JS.
 *
 * The image sits in a fixed 4:3 box with explicit `sizes`, so the browser
 * reserves the space before load and the grid never shifts (PART 21).
 */
export function PackageCard({
  package: pkg,
  priority = false,
  className,
}: PackageCardProps) {
  const discount =
    pkg.compareAtPrice && pkg.compareAtPrice > pkg.price
      ? Math.round(((pkg.compareAtPrice - pkg.price) / pkg.compareAtPrice) * 100)
      : 0;

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl bg-white',
        // A solid accent hairline: at low opacity it read as grey against the
        // white card. shadow-[var(...)] not shadow-[--...]: Tailwind v4 emits
        // the bare token as a literal, which invalidates box-shadow entirely
        // and silently drops the ring with it.
        'shadow-[var(--shadow-card)] ring-1 ring-accent-600',
        'transition-[box-shadow,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
        'hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]',
        'motion-reduce:transform-none motion-reduce:transition-none',
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-sand-200">
        <Image
          src={pkg.coverImage.url}
          alt={pkg.coverImage.alt || pkg.title}
          fill
          sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
          priority={priority}
          loading={priority ? undefined : 'lazy'}
          className={cn(
            'object-cover transition-transform duration-700',
            'ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105',
            'motion-reduce:transform-none motion-reduce:transition-none',
          )}
        />

        {/* Legibility scrim for the badges */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-sand-950/45 via-transparent to-transparent"
        />

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {pkg.featured && (
            <span className="rounded-full bg-accent-600 px-2.5 py-1 text-[0.6875rem] font-semibold tracking-wide text-white uppercase">
              Featured
            </span>
          )}
          {discount > 0 && (
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-[0.6875rem] font-semibold text-accent-700">
              Save {discount}%
            </span>
          )}
        </div>

        <span className="absolute right-3 bottom-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-sand-800">
          {formatDuration(pkg.duration.nights, pkg.duration.days)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        {pkg.destinations.length > 0 && (
          <p className="mb-1.5 flex items-center gap-1 text-xs font-medium text-brand-700">
            <PinIcon />
            {pkg.destinations.map((destination) => destination.name).join(' · ')}
          </p>
        )}

        <h3 className="font-display text-lg leading-snug font-semibold text-sand-900">
          {/* Stretched link: the whole card is clickable, one tab stop */}
          <Link href={`/packages/${pkg.slug}`} className="before:absolute before:inset-0">
            <span className="line-clamp-2">{pkg.title}</span>
          </Link>
        </h3>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-sand-600">
          {pkg.shortDescription}
        </p>

        {pkg.rating.count > 0 && (
          <div className="mt-3">
            <Rating value={pkg.rating.average} count={pkg.rating.count} size="sm" />
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            {pkg.compareAtPrice && pkg.compareAtPrice > pkg.price && (
              <p className="text-xs text-sand-400 line-through">
                {formatPrice(pkg.compareAtPrice)}
              </p>
            )}
            <p className="font-display text-xl font-semibold text-sand-900">
              {formatPrice(pkg.price)}
            </p>
            {pkg.priceNote && (
              <p className="text-[0.6875rem] text-sand-500">{pkg.priceNote}</p>
            )}
          </div>

          <span
            aria-hidden="true"
            className={cn(
              'grid size-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700',
              'transition-colors duration-200 group-hover:bg-accent-600 group-hover:text-white',
            )}
          >
            <svg
              className="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </div>

        {/*
          Both controls sit above the title's stretched link, which otherwise
          covers the whole card: `relative z-10` lifts them out of its way so
          they receive their own clicks.
        */}
        <div className="mt-4 flex items-center gap-2 border-t border-sand-100 pt-4">
          <BookNowButton
            packageId={pkg.id}
            packageTitle={pkg.title}
            price={pkg.price}
          />

          <Link
            href="/contact"
            className={cn(
              'relative z-10 flex-1 rounded-full px-4 py-2.5 text-center text-sm font-medium',
              'text-brand-800 ring-1 ring-brand-700 transition-colors',
              'hover:bg-brand-700 hover:text-white',
              'focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none',
            )}
          >
            Contact us
          </Link>
        </div>
      </div>
    </article>
  );
}

function PinIcon() {
  return (
    <svg
      className="size-3.5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
