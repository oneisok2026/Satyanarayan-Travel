import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** Shown wherever a list legitimately has nothing in it. */
export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl',
        'border border-dashed border-sand-300 bg-white/60 px-6 py-14 text-center',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="grid size-12 place-items-center rounded-full bg-brand-50 text-brand-600"
      >
        {icon ?? <CompassIcon />}
      </span>

      <h3 className="text-lg font-semibold text-sand-900">{title}</h3>

      {description && (
        <p className="max-w-sm text-sm leading-relaxed text-sand-600">{description}</p>
      )}

      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

function CompassIcon() {
  return (
    <svg
      className="size-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
    </svg>
  );
}
