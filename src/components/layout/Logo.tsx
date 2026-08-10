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
  sm: 'size-14',
  md: 'size-18 lg:size-20',
} as const;

/**
 * Brand lockup: mark stacked above the wordmark, linking home.
 *
 * Explicit width/height rather than `fill` — the mark renders at a fixed size,
 * so this emits a bounded srcset instead of the full ladder up to 1920px that
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
      className={cn('flex shrink-0 flex-col items-center gap-1', className)}
    >
      <span className={cn('shrink-0 overflow-hidden rounded-xl', MARK_SIZES[size])}>
        <Image
          src="/logo.png"
          alt=""
          // Requested at 2x the 80px desktop render, so the emitted 200/384px
          // srcset covers retina without pulling the 1254px source.
          width={200}
          height={200}
          // Above the fold in the header on every page.
          priority
          className="size-full object-contain"
        />
      </span>

      {!markOnly && (
        <span
          className={cn(
            // Held on one line: the full legal name is long, and wrapping it
            // mid-phrase reads worse than a smaller wordmark.
            'font-display text-[0.5625rem] leading-none font-semibold tracking-tight whitespace-nowrap sm:text-[0.625rem] lg:text-[0.6875rem]',
            invert ? 'text-white' : 'text-brand-900',
          )}
        >
          {clientEnv.NEXT_PUBLIC_SITE_NAME}
        </span>
      )}
    </Link>
  );
}
