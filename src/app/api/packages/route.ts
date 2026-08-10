import type { NextRequest } from 'next/server';
import { route } from '@/lib/api-handler';
import { apiSuccess, buildPaginationMeta, cachePresets } from '@/lib/api-response';
import { packageListQuerySchema } from '@/lib/validation/catalog.schema';
import { searchParamsToObject } from '@/lib/validation/common.schema';
import { listPublishedPackages } from '@/services/package.service';

export const runtime = 'nodejs';

/** GET /api/packages — public, published packages only. */
export const GET = route('GET /api/packages', async (request: NextRequest) => {
  const query = packageListQuerySchema.parse(
    searchParamsToObject(request.nextUrl.searchParams),
  );

  const { packages, total } = await listPublishedPackages({
    type: query.type,
    destinationSlug: query.destination,
    categorySlug: query.category,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    minNights: query.minNights,
    maxNights: query.maxNights,
    featured: query.featured,
    search: query.search,
    sort: query.sort,
    page: query.page,
    limit: query.limit,
  });

  return apiSuccess(
    { packages },
    {
      meta: buildPaginationMeta(query.page, query.limit, total),
      cacheControl: cachePresets.publicShort,
    },
  );
});
