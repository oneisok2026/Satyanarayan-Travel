import { route } from '@/lib/api-handler';
import { apiSuccess, cachePresets } from '@/lib/api-response';
import { slugSchema } from '@/lib/validation/common.schema';
import { getPublishedDestinationBySlug } from '@/services/destination.service';
import { listPublishedPackages } from '@/services/package.service';

export const runtime = 'nodejs';

export const GET = route<{ params: Promise<{ slug: string }> }>(
  'GET /api/destinations/[slug]',
  async (_request, { params }) => {
    const { slug } = await params;
    const validSlug = slugSchema.parse(slug);

    const destination = await getPublishedDestinationBySlug(validSlug);
    const { packages } = await listPublishedPackages({
      destinationSlug: validSlug,
      page: 1,
      limit: 12,
    });

    return apiSuccess(
      { destination, packages },
      { cacheControl: cachePresets.publicMedium },
    );
  },
);
