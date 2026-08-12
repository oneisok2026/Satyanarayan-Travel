import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { DestinationDTO } from '@/types';

interface DestinationCardProps {
  destination: DestinationDTO;
  priority?: boolean;
  /** Taller portrait treatment for the homepage feature strip. */
  variant?: 'tall' | 'standard';
  className?: string;
}

/**
 * Destination card with a full-bleed image and overlaid caption.
 * The gradient scrim is what keeps the white text legible over
 * unpredictable photography.
 */
export function DestinationCard({
  destination,
  priority = false,
  variant = 'standard',
  className,
}: DestinationCardProps) {
  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-sand-200',
        variant === 'tall' ? 'aspect-[3/4]' : 'aspect-[4/3]',
        'ring-1 ring-accent-600',
        'transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
        'hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]',
        'motion-reduce:transform-none motion-reduce:transition-none',
        className,
      )}
    >
      <Image
        src={destination.coverImage.url}
        alt={destination.coverImage.alt || destination.name}
        fill
        sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
        priority={priority}
        loading={priority ? undefined : 'lazy'}
        className={cn(
          'object-cover transition-transform duration-700',
          'ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110',
          'motion-reduce:transform-none motion-reduce:transition-none',
        )}
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-sand-950/85 via-sand-950/25 to-transparent"
      />

      <div className="absolute inset-x-0 bottom-0 p-5">
        <p className="text-[0.6875rem] font-medium tracking-[0.14em] text-accent-300 uppercase">
          {destination.type === 'domestic' ? 'India' : destination.country}
        </p>

        <h3 className="mt-1 font-display text-xl font-semibold text-white">
          <Link
            href={`/destinations/${destination.slug}`}
            className="before:absolute before:inset-0"
          >
            {destination.name}
          </Link>
        </h3>

        {/* Revealed on hover; always visible when motion is reduced */}
        <p
          className={cn(
            'mt-1 line-clamp-2 max-w-xs text-sm leading-relaxed text-sand-200',
            'max-h-0 overflow-hidden opacity-0 transition-[max-height,opacity,margin]',
            'duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
            'group-hover:mt-2 group-hover:max-h-20 group-hover:opacity-100',
            'motion-reduce:mt-2 motion-reduce:max-h-20 motion-reduce:opacity-100',
            'motion-reduce:transition-none',
          )}
        >
          {destination.shortDescription}
        </p>

        {destination.packageCount != null && destination.packageCount > 0 && (
          <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {destination.packageCount}{' '}
            {destination.packageCount === 1 ? 'package' : 'packages'}
          </p>
        )}
      </div>
    </article>
  );
}
