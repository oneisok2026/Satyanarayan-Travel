import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  /** Builds the href for a page number, preserving existing filters. */
  buildHref: (page: number) => string;
  className?: string;
}

/**
 * Link-based pagination.
 *
 * Real anchors rather than buttons so pages are crawlable and shareable, and
 * so listing pages keep working without client JS.
 */
export function Pagination({ page, totalPages, buildHref, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = pageWindow(page, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex items-center justify-center gap-1.5', className)}
    >
      <Edge
        href={buildHref(page - 1)}
        disabled={page <= 1}
        label="Previous page"
        direction="prev"
      />

      {pages.map((item, index) =>
        item === 'gap' ? (
          <span
            key={`gap-${index}`}
            aria-hidden="true"
            className="px-1.5 text-sand-400"
          >
            …
          </span>
        ) : (
          <Link
            key={item}
            href={buildHref(item)}
            aria-current={item === page ? 'page' : undefined}
            aria-label={`Page ${item}`}
            className={cn(
              'grid size-10 place-items-center rounded-full text-sm font-medium',
              'transition-colors duration-200',
              item === page
                ? 'bg-brand-700 text-white'
                : 'text-sand-700 hover:bg-sand-100',
            )}
          >
            {item}
          </Link>
        ),
      )}

      <Edge
        href={buildHref(page + 1)}
        disabled={page >= totalPages}
        label="Next page"
        direction="next"
      />
    </nav>
  );
}

function Edge({
  href,
  disabled,
  label,
  direction,
}: {
  href: string;
  disabled: boolean;
  label: string;
  direction: 'prev' | 'next';
}) {
  const icon = (
    <svg
      className={cn('size-4', direction === 'next' && 'rotate-180')}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );

  const classes =
    'grid size-10 place-items-center rounded-full transition-colors duration-200';

  if (disabled) {
    return (
      <span
        aria-disabled="true"
        aria-label={label}
        className={cn(classes, 'cursor-not-allowed text-sand-300')}
      >
        {icon}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label={label}
      rel={direction}
      className={cn(classes, 'text-sand-700 hover:bg-sand-100')}
    >
      {icon}
    </Link>
  );
}

/** First, last, and a window around the current page; gaps elsewhere. */
function pageWindow(page: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const items: (number | 'gap')[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);

  if (start > 2) items.push('gap');
  for (let i = start; i <= end; i++) items.push(i);
  if (end < total - 1) items.push('gap');

  items.push(total);
  return items;
}
