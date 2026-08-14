import type { NextRequest } from 'next/server';
import { route, readJsonBody } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { z } from 'zod';
import { objectIdSchema } from '@/lib/validation/common.schema';
import { requireUser } from '@/lib/firebase/auth';
import { connectToDatabase } from '@/lib/db/connect';
import { Favourite } from '@/models/Favourite';
import { TourPackage } from '@/models/TourPackage';
import { toObjectId } from '@/lib/security/sanitize';
import { notFound } from '@/lib/errors';
import { toPackageSummaryDTO } from '@/services/mappers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const favouriteSchema = z.object({ packageId: objectIdSchema });

/** GET /api/favourites — the signed-in customer's saved packages. */
export const GET = route('GET /api/favourites', async () => {
  const user = await requireUser();
  await connectToDatabase();

  const favourites = await Favourite.find({ userId: user._id })
    .populate({
      path: 'packageId',
      select:
        'title slug type destinationIds categoryId shortDescription coverImage duration price compareAtPrice priceNote priceOnRequest featured rating',
      populate: [
        { path: 'destinationIds', select: 'name slug' },
        { path: 'categoryId', select: 'name slug' },
      ],
    })
    .sort({ createdAt: -1 })
    .lean();

  const items = favourites
    // populate() replaces the ObjectId with the document, but the static type
    // still says ObjectId. A deleted package also leaves a dangling null ref,
    // so check for the populated shape rather than mere presence.
    .filter((favourite) => isPopulated(favourite.packageId))
    .map((favourite) => ({
      id: String(favourite._id),
      package: toPackageSummaryDTO(favourite.packageId as unknown as object),
      createdAt: favourite.createdAt.toISOString(),
    }));

  return apiSuccess({ favourites: items });
});

/** True once populate() has swapped the ObjectId for the actual document. */
function isPopulated(value: unknown): boolean {
  return value != null && typeof value === 'object' && 'slug' in value;
}

/**
 * POST /api/favourites — idempotent add.
 * The unique (userId, packageId) index makes a double-tap a no-op.
 */
export const POST = route('POST /api/favourites', async (request: NextRequest) => {
  const user = await requireUser();
  const { packageId } = favouriteSchema.parse(await readJsonBody(request));

  await connectToDatabase();

  const exists = await TourPackage.exists({
    _id: toObjectId(packageId, 'packageId'),
    status: 'published',
  });
  if (!exists) throw notFound('Package');

  await Favourite.updateOne(
    { userId: user._id, packageId: toObjectId(packageId) },
    { $setOnInsert: { userId: user._id, packageId: toObjectId(packageId) } },
    { upsert: true },
  );

  return apiSuccess({ favourited: true }, { message: 'Saved to your favourites' });
});

/** DELETE /api/favourites?packageId=… — idempotent remove. */
export const DELETE = route('DELETE /api/favourites', async (request: NextRequest) => {
  const user = await requireUser();
  const { packageId } = favouriteSchema.parse({
    packageId: request.nextUrl.searchParams.get('packageId') ?? '',
  });

  await connectToDatabase();
  await Favourite.deleteOne({ userId: user._id, packageId: toObjectId(packageId) });

  return apiSuccess({ favourited: false }, { message: 'Removed from your favourites' });
});
