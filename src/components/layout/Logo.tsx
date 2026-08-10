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

/**
 * Layout box for the mark. The artwork renders larger than this via scale,
 * so these values are what the lockup actually occupies in the header row.
 */
const MARK_SIZES = {
  sm: 'size-11',
  md: 'size-12 lg:size-14',
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
      className={cn('flex shrink-0 flex-col items-center gap-0.5', className)}
    >
      {/*
        The mark's layout box is deliberately shorter than the artwork:
        `scale` grows the image visually without adding height to the lockup,
        so the wordmark below stays inside the header row instead of being
        clipped by its bottom edge.
      */}
      <span className={cn('relative shrink-0', MARK_SIZES[size])}>
        <Image
          src="/logo.png"
          alt=""
          // Requested at ~2x the scaled render, so the srcset covers retina
          // without pulling the 1254px source.
          width={256}
          height={256}
          // Above the fold in the header on every page.
          priority
          className="absolute inset-0 size-full scale-135 object-contain"
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
