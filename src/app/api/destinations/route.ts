import type { NextRequest } from 'next/server';
import { route } from '@/lib/api-handler';
import { apiSuccess, buildPaginationMeta, cachePresets } from '@/lib/api-response';
import { destinationListQuerySchema } from '@/lib/validation/catalog.schema';
import { searchParamsToObject } from '@/lib/validation/common.schema';
import { listPublishedDestinations } from '@/services/destination.service';

export const runtime = 'nodejs';

export const GET = route('GET /api/destinations', async (request: NextRequest) => {
  const query = destinationListQuerySchema.parse(
    searchParamsToObject(request.nextUrl.searchParams),
  );

  const { destinations, total } = await listPublishedDestinations(query);

  return apiSuccess(
    { destinations },
    {
      meta: buildPaginationMeta(query.page, query.limit, total),
      cacheControl: cachePresets.publicMedium,
    },
  );
});
