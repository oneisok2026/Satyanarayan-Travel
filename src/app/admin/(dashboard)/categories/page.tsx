import type { Metadata } from 'next';
import { z } from 'zod';
import { requireAdminPage } from '@/lib/firebase/auth';
import { connectToDatabase } from '@/lib/db/connect';
import { Category } from '@/models/Category';
import { paginationSchema, offsetFor } from '@/lib/validation/common.schema';
import { buildSearchRegex } from '@/lib/security/sanitize';
import { PageHeading } from '@/components/admin/PageHeading';
import { NewItemButton } from '@/components/admin/NewItemButton';
import { SearchFilters } from '@/components/ui/SearchFilters';
import { CatalogueTable, type CatalogueRow } from '@/components/admin/CatalogueTable';
import { CONTENT_STATUSES } from '@/constants';

export const metadata: Metadata = {
  title: 'Categories',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const querySchema = paginationSchema.extend({
  search: z.string().trim().max(80).optional(),
  status: z.enum(CONTENT_STATUSES).optional(),
});

export default async function AdminCategorysPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdminPage('/admin/categories');

  const raw = await searchParams;
  const parsed = querySchema.safeParse(raw);
  const query = parsed.success ? parsed.data : querySchema.parse({});

  await connectToDatabase();

  // Admin sees every status, unlike the public services which pin published.
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.search) filter.name = buildSearchRegex(query.search);

  const [documents, total] = await Promise.all([
    Category.find(filter)
      .select('name slug status description featured sortOrder updatedAt')
      .sort({ updatedAt: -1 })
      .skip(offsetFor(query.page, query.limit))
      .limit(query.limit)
      .lean(),
    Category.countDocuments(filter),
  ]);

  const rows: CatalogueRow[] = documents.map((doc) => ({
    id: String(doc._id),
    title: doc.name,
    slug: doc.slug,
    status: doc.status,
    meta: `Sort order ${doc.sortOrder}`,
    featured: doc.featured ?? false,
    updatedAt: doc.updatedAt.toISOString(),
  }));

  return (
    <>
      <PageHeading
        title="Categories"
        description={`${total} ${total === 1 ? 'category' : 'categories'} in the catalogue.`}
        action={
          admin.role === 'super_admin' ? (
            <NewItemButton href="/admin/categories/new" label="New category" />
          ) : undefined
        }
      />

      <SearchFilters
        className="mb-6"
        placeholder="Search categorys…"
        filters={[
          {
            name: 'status',
            label: 'All statuses',
            options: CONTENT_STATUSES.map((status) => ({
              value: status,
              label: status.replace(/^\w/, (c) => c.toUpperCase()),
            })),
          },
        ]}
      />

      <CatalogueTable
        rows={rows}
        page={query.page}
        totalPages={Math.ceil(total / query.limit)}
        basePath="/admin/categories"
        resource="categories"
        canManage={admin.role === 'super_admin'}
        editBasePath="/admin/categories"
        params={{ search: query.search, status: query.status }}
        emptyTitle="No categorys found"
        emptyDescription="Nothing matches these filters. Clear them to see everything."
      />
    </>
  );
}
