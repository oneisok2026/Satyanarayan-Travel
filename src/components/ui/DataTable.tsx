import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  /** Hidden below md, for secondary detail on narrow screens. */
  secondary?: boolean;
  align?: 'left' | 'right';
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  empty: { title: string; description?: string; action?: ReactNode };
  className?: string;
}

/**
 * Responsive table.
 *
 * A real <table> on md and up; a card list below that, since a horizontally
 * scrolling table is unusable on a phone. Both render from one column
 * definition, so the two views cannot drift apart.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty,
  className,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title={empty.title}
        description={empty.description}
        action={empty.action}
      />
    );
  }

  const primary = columns.filter((column) => !column.secondary);

  return (
    <div className={className}>
      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-2xl bg-white ring-1 ring-sand-200 md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-sand-200 bg-sand-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn(
                      'px-4 py-3 text-xs font-semibold tracking-wide text-sand-600 uppercase',
                      column.align === 'right' && 'text-right',
                    )}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {rows.map((row) => (
                <tr key={rowKey(row)} className="transition-colors hover:bg-sand-50/60">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        'px-4 py-3.5 align-middle text-sand-700',
                        column.align === 'right' && 'text-right',
                      )}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile */}
      <ul className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => (
          <li
            key={rowKey(row)}
            className="rounded-2xl bg-white p-4 ring-1 ring-sand-200"
          >
            <dl className="flex flex-col gap-2">
              {primary.map((column) => (
                <div
                  key={column.key}
                  className="flex items-start justify-between gap-3"
                >
                  <dt className="shrink-0 text-xs font-medium text-sand-500">
                    {column.header}
                  </dt>
                  <dd className="min-w-0 text-right text-sm text-sand-800">
                    {column.render(row)}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
