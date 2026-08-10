import type { NextRequest } from 'next/server';
import { route } from '@/lib/api-handler';
import { apiSuccess, buildPaginationMeta, cachePresets } from '@/lib/api-response';
import { blogListQuerySchema } from '@/lib/validation/catalog.schema';
import { searchParamsToObject } from '@/lib/validation/common.schema';
import { listPublishedPosts } from '@/services/content.service';

export const runtime = 'nodejs';

export const GET = route('GET /api/blogs', async (request: NextRequest) => {
  const query = blogListQuerySchema.parse(
    searchParamsToObject(request.nextUrl.searchParams),
  );

  const { posts, total } = await listPublishedPosts(query);

  return apiSuccess(
    { posts },
    {
      meta: buildPaginationMeta(query.page, query.limit, total),
      cacheControl: cachePresets.publicShort,
    },
  );
});
