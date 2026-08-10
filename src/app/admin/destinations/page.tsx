import type { Metadata } from 'next';
import { z } from 'zod';
import { requireAdminPage } from '@/lib/firebase/auth';
import { connectToDatabase } from '@/lib/db/connect';
import { Destination } from '@/models/Destination';
import { paginationSchema, offsetFor } from '@/lib/validation/common.schema';
import { buildSearchRegex } from '@/lib/security/sanitize';
import { PageHeading } from '@/components/admin/PageHeading';
import { SearchFilters } from '@/components/ui/SearchFilters';
import { CatalogueTable, type CatalogueRow } from '@/components/admin/CatalogueTable';
import { CONTENT_STATUSES, PACKAGE_TYPES } from '@/constants';

export const metadata: Metadata = {
  title: 'Destinations',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const querySchema = paginationSchema.extend({
  search: z.string().trim().max(80).optional(),
  status: z.enum(CONTENT_STATUSES).optional(),
  type: z.enum(PACKAGE_TYPES).optional(),
});

export default async function AdminDestinationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPage('/admin/destinations');

  const raw = await searchParams;
  const parsed = querySchema.safeParse(raw);
  const query = parsed.success ? parsed.data : querySchema.parse({});

  await connectToDatabase();

  // Admin sees every status, unlike the public services which pin published.
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;
  if (query.search) filter.name = buildSearchRegex(query.search);

  const [documents, total] = await Promise.all([
    Destination.find(filter)
      .select('name slug status type country region coverImage featured updatedAt')
      .sort({ updatedAt: -1 })
      .skip(offsetFor(query.page, query.limit))
      .limit(query.limit)
      .lean(),
    Destination.countDocuments(filter),
  ]);

  const rows: CatalogueRow[] = documents.map((doc) => ({
    id: String(doc._id),
    title: doc.name,
    slug: doc.slug,
    status: doc.status,
    image: doc.coverImage
      ? { url: doc.coverImage.url, alt: doc.coverImage.alt }
      : undefined,
    meta: doc.region ? `${doc.country} · ${doc.region}` : doc.country,
    featured: doc.featured ?? false,
    updatedAt: doc.updatedAt.toISOString(),
    publicHref: doc.status === 'published' ? `/destinations/${doc.slug}` : undefined,
  }));

  return (
    <>
      <PageHeading
        title="Destinations"
        description={`${total} ${total === 1 ? 'destination' : 'destinations'} in the catalogue.`}
      />

      <SearchFilters
        className="mb-6"
        placeholder="Search destinations…"
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
        basePath="/admin/destinations"
        params={{ search: query.search, status: query.status, type: query.type }}
        emptyTitle="No destinations found"
        emptyDescription="Nothing matches these filters. Clear them to see everything."
      />
    </>
  );
}
