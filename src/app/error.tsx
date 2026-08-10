'use client';

import { useEffect } from 'react';
import { Button, ButtonLink } from '@/components/ui/Button';

/**
 * Route-level error boundary.
 *
 * Shows a recovery path, never the raw error. The digest is surfaced so a user
 * can quote it to support and it can be matched against server logs.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server-side details are already logged; this captures client-side faults.
    console.error('Route error boundary:', error.message, error.digest);
  }, [error]);

  return (
    <main className="grid min-h-[70vh] place-items-center px-5 py-20">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <span
          aria-hidden="true"
          className="grid size-14 place-items-center rounded-full bg-red-50 text-red-600"
        >
          <svg
            className="size-7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </span>

        <h1 className="text-2xl font-semibold text-sand-900">Something went wrong</h1>

        <p className="text-[0.9375rem] leading-relaxed text-sand-600">
          We hit an unexpected problem loading this page. Please try again — if it keeps
          happening, get in touch and we&apos;ll sort it out.
        </p>

        {error.digest && (
          <p className="font-mono text-xs text-sand-400">Reference: {error.digest}</p>
        )}

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <ButtonLink href="/" variant="outline">
            Back to home
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
