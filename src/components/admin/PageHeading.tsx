import Link from 'next/link';
import type { ReactNode } from 'react';

interface PageHeadingProps {
  title: string;
  description?: string;
  /** Primary action, e.g. "New package". */
  action?: ReactNode;
  /** Renders a back link above the title, e.g. "/admin/packages". */
  backHref?: string;
  /** Label for the back link. Defaults to a generic "Back". */
  backLabel?: string;
}

/** Consistent heading block for every admin module. */
export function PageHeading({
  title,
  description,
  action,
  backHref,
  backLabel = 'Back',
}: PageHeadingProps) {
  return (
    <div className="mb-6">
      {backHref && (
        <Link
          href={backHref}
          className="mb-3 -ml-1 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-medium text-sand-600 transition-colors hover:bg-sand-100 hover:text-sand-900 focus-visible:ring-4 focus-visible:ring-brand-500/12 focus-visible:outline-none"
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
            aria-hidden="true"
          >
            <path d="M12 15 7 10l5-5" />
          </svg>
          {backLabel}
        </Link>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-sand-900">{title}</h1>
          {description && <p className="mt-1 text-sm text-sand-600">{description}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}
