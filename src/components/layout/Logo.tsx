import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { clientEnv } from '@/lib/env';

interface LogoProps {
  /** Renders light text for dark backgrounds (footer, auth pages). */
  invert?: boolean;
  /** Hides the wordmark, leaving only the mark. */
  markOnly?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const MARK_SIZES = {
  sm: 'size-10',
  md: 'size-11 lg:size-12',
} as const;

/**
 * Brand lockup: mark stacked above the wordmark, linking home.
 *
 * Explicit width/height rather than `fill` — the mark renders at a fixed size,
 * so this emits a 64/128px srcset instead of the full ladder up to 1920px that
 * `fill` would generate for the 1254px source.
 */
export function Logo({
  invert = false,
  markOnly = false,
  size = 'md',
  className,
}: LogoProps) {
  return (
    <Link
      href="/"
      aria-label={`${clientEnv.NEXT_PUBLIC_SITE_NAME} — home`}
      className={cn('flex shrink-0 flex-col items-center gap-1.5', className)}
    >
      <span className={cn('shrink-0 overflow-hidden rounded-xl', MARK_SIZES[size])}>
        <Image
          src="/logo.png"
          alt=""
          width={64}
          height={64}
          // Above the fold in the header on every page.
          priority
          className="size-full object-contain"
        />
      </span>

      {!markOnly && (
        // Inherits the link's alignment, so passing `items-start` left-aligns
        // the whole lockup rather than only the mark.
        <span
          className="flex flex-col leading-none"
          style={{ alignItems: 'inherit' }}
        >
          <span
            className={cn(
              // Held on one line: the full legal name is long, and wrapping it
              // mid-phrase reads worse than a slightly smaller wordmark.
              'font-display text-[0.8125rem] font-semibold tracking-tight whitespace-nowrap sm:text-sm lg:text-[0.9375rem]',
              invert ? 'text-white' : 'text-brand-900',
            )}
          >
            {clientEnv.NEXT_PUBLIC_SITE_NAME}
          </span>
          <span
            className={cn(
              'mt-1 hidden text-[0.5625rem] tracking-[0.18em] whitespace-nowrap uppercase sm:block',
              invert ? 'text-sand-400' : 'text-sand-500',
            )}
          >
            Tours &amp; Travels
          </span>
        </span>
      )}
    </Link>
  );
}
