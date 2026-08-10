import Link from 'next/link';
import Image from 'next/image';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { formatDate } from '@/lib/utils';
import type { ContentStatus } from '@/constants';

export interface CatalogueRow {
  id: string;
  title: string;
  slug: string;
  status: ContentStatus;
  image?: { url: string; alt: string };
  meta?: string;
  featured?: boolean;
  updatedAt: string;
  /** Public URL, so an admin can preview the live page. */
  publicHref?: string;
}

interface CatalogueTableProps {
  rows: CatalogueRow[];
  page: number;
  totalPages: number;
  basePath: string;
  emptyTitle: string;
  emptyDescription: string;
  /** Extra query params to preserve across pagination. */
  params?: Record<string, string | undefined>;
}

/**
 * Shared listing for the catalogue and content modules.
 *
 * These modules differ only in their data source, so one table keeps the
 * columns, empty states and pagination consistent across all of them.
 */
export function CatalogueTable({
  rows,
  page,
  totalPages,
  basePath,
  emptyTitle,
  emptyDescription,
  params = {},
}: CatalogueTableProps) {
  const columns: Column<CatalogueRow>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (row) => (
        <div className="flex min-w-0 items-center gap-3">
          {row.image && (
            <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-sand-200">
              <Image
                src={row.image.url}
                alt=""
                fill
                sizes="40px"
                loading="lazy"
                className="object-cover"
              />
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-medium text-sand-900">{row.title}</p>
            <p className="truncate font-mono text-xs text-sand-500">/{row.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'meta',
      header: 'Details',
      secondary: true,
      render: (row) => row.meta ?? '—',
    },
    {
      key: 'featured',
      header: 'Featured',
      secondary: true,
      render: (row) => (row.featured ? 'Yes' : 'No'),
    },
    {
      key: 'updated',
      header: 'Updated',
      secondary: true,
      render: (row) => formatDate(row.updatedAt),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge.Content status={row.status} />,
    },
    {
      key: 'actions',
      header: 'View',
      align: 'right',
      render: (row) =>
        row.publicHref ? (
          <Link
            href={row.publicHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-brand-700 underline-offset-4 hover:underline"
          >
            Preview
          </Link>
        ) : (
          <span className="text-xs text-sand-400">—</span>
        ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        empty={{ title: emptyTitle, description: emptyDescription }}
      />

      {totalPages > 1 && (
        <Pagination
          className="mt-8"
          page={page}
          totalPages={totalPages}
          buildHref={(target) => {
            const search = new URLSearchParams();
            for (const [key, value] of Object.entries(params)) {
              if (value) search.set(key, value);
            }
            if (target > 1) search.set('page', String(target));
            const qs = search.toString();
            return qs ? `${basePath}?${qs}` : basePath;
          }}
        />
      )}
    </>
  );
}
