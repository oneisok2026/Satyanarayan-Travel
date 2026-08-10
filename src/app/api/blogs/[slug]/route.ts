import { route } from '@/lib/api-handler';
import { apiSuccess, cachePresets } from '@/lib/api-response';
import { slugSchema } from '@/lib/validation/common.schema';
import { getPublishedPostBySlug, getRelatedPosts } from '@/services/content.service';

export const runtime = 'nodejs';

export const GET = route<{ params: Promise<{ slug: string }> }>(
  'GET /api/blogs/[slug]',
  async (_request, { params }) => {
    const { slug } = await params;
    const post = await getPublishedPostBySlug(slugSchema.parse(slug));
    const related = await getRelatedPosts(post.id, 3);

    return apiSuccess({ post, related }, { cacheControl: cachePresets.publicShort });
  },
);
