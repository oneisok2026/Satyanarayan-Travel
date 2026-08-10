import { route } from '@/lib/api-handler';
import { apiSuccess, cachePresets } from '@/lib/api-response';
import { slugSchema } from '@/lib/validation/common.schema';
import {
  getPublishedPackageBySlug,
  getRelatedPackages,
} from '@/services/package.service';

export const runtime = 'nodejs';

/** GET /api/packages/[slug] — detail plus related packages. */
export const GET = route<{ params: Promise<{ slug: string }> }>(
  'GET /api/packages/[slug]',
  async (_request, { params }) => {
    const { slug } = await params;
    const validSlug = slugSchema.parse(slug);

    const tourPackage = await getPublishedPackageBySlug(validSlug);
    const related = await getRelatedPackages(tourPackage.id, 3);

    return apiSuccess(
      { package: tourPackage, related },
      { cacheControl: cachePresets.publicShort },
    );
  },
);
