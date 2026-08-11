import type { Metadata } from 'next';
import { requireAdminPage } from '@/lib/firebase/auth';
import { connectToDatabase } from '@/lib/db/connect';
import { TourPackage } from '@/models/TourPackage';
import { paginationSchema, offsetFor } from '@/lib/validation/common.schema';
import { buildSearchRegex } from '@/lib/security/sanitize';
import { PageHeading } from '@/components/admin/PageHeading';
import { NewItemButton } from '@/components/admin/NewItemButton';
import { SearchFilters } from '@/components/ui/SearchFilters';
import { CatalogueTable, type CatalogueRow } from '@/components/admin/CatalogueTable';
import { formatPrice, formatDuration } from '@/lib/utils';
import { CONTENT_STATUSES, PACKAGE_TYPES } from '@/constants';
import { z } from 'zod';

export const metadata: Metadata = {
  title: 'Packages',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const querySchema = paginationSchema.extend({
  search: z.string().trim().max(80).optional(),
  status: z.enum(CONTENT_STATUSES).optional(),
  type: z.enum(PACKAGE_TYPES).optional(),
});

export default async function AdminPackagesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdminPage('/admin/packages');

  const raw = await searchParams;
  const parsed = querySchema.safeParse(raw);
  const query = parsed.success ? parsed.data : querySchema.parse({});

  await connectToDatabase();

  // Admin sees every status, unlike the public service which pins published.
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;
  if (query.search) filter.title = buildSearchRegex(query.search);

  const [documents, total] = await Promise.all([
    TourPackage.find(filter)
      .select('title slug status type price duration coverImage featured updatedAt')
      .sort({ updatedAt: -1 })
      .skip(offsetFor(query.page, query.limit))
      .limit(query.limit)
      .lean(),
    TourPackage.countDocuments(filter),
  ]);

  const rows: CatalogueRow[] = documents.map((doc) => ({
    id: String(doc._id),
    title: doc.title,
    slug: doc.slug,
    status: doc.status,
    image: doc.coverImage
      ? { url: doc.coverImage.url, alt: doc.coverImage.alt }
      : undefined,
    meta: `${formatPrice(doc.price)} · ${formatDuration(doc.duration.nights, doc.duration.days)}`,
    featured: doc.featured,
    updatedAt: doc.updatedAt.toISOString(),
    publicHref: doc.status === 'published' ? `/packages/${doc.slug}` : undefined,
  }));

  return (
    <>
      <PageHeading
        title={
          query.type === 'domestic'
            ? 'Domestic tours'
            : query.type === 'international'
              ? 'International tours'
              : 'Packages'
        }
        description={
          query.type
            ? `${total} ${total === 1 ? 'package' : 'packages'} of this type.`
            : `${total} ${total === 1 ? 'package' : 'packages'} in the catalogue.`
        }
        action={
          admin.role === 'super_admin' ? (
            <NewItemButton
              href={
                query.type ? `/admin/packages/new?type=${query.type}` : '/admin/packages/new'
              }
              label="New package"
            />
          ) : undefined
        }
      />

      <SearchFilters
        className="mb-6"
        placeholder="Search package titles…"
        filters={[
          {
            name: 'status',
            label: 'All statuses',
            options: CONTENT_STATUSES.map((status) => ({
              value: status,
              label: status.replace(/^\w/, (c) => c.toUpperCase()),
            })),
          },
          {
            name: 'type',
            label: 'All types',
            options: PACKAGE_TYPES.map((type) => ({
              value: type,
              label: type.replace(/^\w/, (c) => c.toUpperCase()),
            })),
          },
        ]}
      />

      <CatalogueTable
        rows={rows}
        page={query.page}
        totalPages={Math.ceil(total / query.limit)}
        basePath="/admin/packages"
        resource="packages"
        canManage={admin.role === 'super_admin'}
        editBasePath="/admin/packages"
        params={{ search: query.search, status: query.status, type: query.type }}
        emptyTitle="No packages found"
        emptyDescription="Nothing matches these filters. Clear them to see the full catalogue."
      />
    </>
  );
}
