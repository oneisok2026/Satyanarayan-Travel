import type { NextRequest } from 'next/server';
import { route } from '@/lib/api-handler';
import { apiSuccess, buildPaginationMeta, cachePresets } from '@/lib/api-response';
import { galleryListQuerySchema } from '@/lib/validation/catalog.schema';
import { searchParamsToObject } from '@/lib/validation/common.schema';
import { listGalleryItems } from '@/services/content.service';

export const runtime = 'nodejs';

export const GET = route('GET /api/gallery', async (request: NextRequest) => {
  const query = galleryListQuerySchema.parse(
    searchParamsToObject(request.nextUrl.searchParams),
  );

  const { items, total, albums } = await listGalleryItems(
    query.album,
    query.page,
    query.limit,
  );

  return apiSuccess(
    { items, albums },
    {
      meta: buildPaginationMeta(query.page, query.limit, total),
      cacheControl: cachePresets.publicMedium,
    },
  );
});
