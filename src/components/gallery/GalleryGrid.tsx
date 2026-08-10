import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { GalleryItemDTO } from '@/types';

interface GalleryGridProps {
  items: GalleryItemDTO[];
  /** Number of leading images loaded eagerly (above the fold). */
  eagerCount?: number;
  className?: string;
}

/**
 * Responsive gallery grid.
 *
 * A CSS mosaic rather than a JS masonry library: every tile has a fixed
 * aspect ratio so the layout is stable before any image loads.
 */
export function GalleryGrid({ items, eagerCount = 0, className }: GalleryGridProps) {
  if (items.length === 0) return null;

  return (
    <ul
      className={cn(
        'grid auto-rows-[minmax(0,1fr)] grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4',
        className,
      )}
    >
      {items.map((item, index) => (
        <li
          key={item.id}
          className={cn(
            'group relative overflow-hidden rounded-xl bg-sand-200',
            // Every third tile spans two rows for visual rhythm.
            index % 5 === 0 ? 'aspect-square lg:row-span-2 lg:aspect-[3/4]' : 'aspect-square',
          )}
        >
          <Image
            src={item.image.url}
            alt={item.image.alt || item.caption || 'Travel photograph'}
            fill
            sizes="(min-width:1024px) 25vw, 50vw"
            loading={index < eagerCount ? undefined : 'lazy'}
            priority={index < eagerCount}
            className={cn(
              'object-cover transition-transform duration-700',
              'ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110',
              'motion-reduce:transform-none motion-reduce:transition-none',
            )}
          />

          {item.caption && (
            <>
              <div
                aria-hidden="true"
                className={cn(
                  'absolute inset-0 bg-gradient-to-t from-sand-950/75 to-transparent',
                  'opacity-0 transition-opacity duration-300 group-hover:opacity-100',
                  'motion-reduce:transition-none',
                )}
              />
              <p
                className={cn(
                  'absolute inset-x-0 bottom-0 p-3 text-xs font-medium text-white',
                  'translate-y-2 opacity-0 transition-[transform,opacity] duration-300',
                  'ease-[cubic-bezier(0.22,1,0.36,1)]',
                  'group-hover:translate-y-0 group-hover:opacity-100',
                  'motion-reduce:translate-y-0 motion-reduce:transition-none',
                )}
              >
                {item.caption}
              </p>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
