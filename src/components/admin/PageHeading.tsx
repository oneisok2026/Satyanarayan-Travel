import type { ReactNode } from 'react';

interface PageHeadingProps {
  title: string;
  description?: string;
  /** Primary action, e.g. "New package". */
  action?: ReactNode;
}

/** Consistent heading block for every admin module. */
export function PageHeading({ title, description, action }: PageHeadingProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-sand-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-sand-600">{description}</p>}
      </div>
      {action}
    </div>
  );
}
