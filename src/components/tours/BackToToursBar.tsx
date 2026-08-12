import Link from 'next/link';
import { cn } from '@/lib/utils';

interface BackToToursBarProps {
  /** Decides the destination and the wording. */
  type: 'domestic' | 'international';
}

/**
 * Sticky "back to the listing" button on a package page.
 *
 * Placed at the top rather than the bottom: on mobile the bottom edge already
 * carries the booking bar, the WhatsApp button and back-to-top, and a fourth
 * fixed control there would either collide or bury the primary CTA. Offset
 * below the site header, which is itself sticky at the top.
 *
 * No scroll state — it is always on screen, so this stays a Server Component
 * and ships no client JavaScript.
 */
export function BackToToursBar({ type }: BackToToursBarProps) {
  const href = type === 'domestic' ? '/tours/domestic' : '/tours/international';
  const label =
    type === 'domestic' ? 'Back to all domestic tours' : 'Back to all international tours';

  return (
    // The band is transparent and non-interactive so it never covers the page
    // beside the button; only the pill itself takes pointer events.
    <div className="no-print pointer-events-none sticky top-20 z-30 lg:top-24">
      <div className="container-page py-3">
        <Link
          href={href}
          className={cn(
            'pointer-events-auto inline-flex items-center gap-2 rounded-full',
            'bg-accent-600 py-2.5 pr-5 pl-4 text-sm font-medium text-white',
            'shadow-[--shadow-float] transition-[background-color,transform]',
            'duration-200 hover:-translate-y-0.5 hover:bg-accent-700',
            'motion-reduce:transform-none motion-reduce:transition-none',
            'focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2',
            'focus-visible:outline-none',
          )}
        >
          <svg
            className="size-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5m0 0 7-7m-7 7 7 7" />
          </svg>
          {label}
        </Link>
      </div>
    </div>
  );
}
