import 'server-only';

import type { FilterQuery } from 'mongoose';
import { connectToDatabase } from '@/lib/db/connect';
import { Destination, type DestinationAttributes } from '@/models/Destination';
import { TourPackage } from '@/models/TourPackage';
import { Category } from '@/models/Category';
import { notFound } from '@/lib/errors';
import { offsetFor } from '@/lib/validation/common.schema';
import type { PackageType } from '@/constants';
import type { CategoryDTO, DestinationDTO } from '@/types';
import { toCategoryDTO, toDestinationDTO } from './mappers';

export interface DestinationListFilters {
  type?: PackageType;
  featured?: boolean;
  page: number;
  limit: number;
}

export async function listPublishedDestinations(
  filters: DestinationListFilters,
): Promise<{ destinations: DestinationDTO[]; total: number }> {
  await connectToDatabase();

  const query: FilterQuery<DestinationAttributes> = { status: 'published' };
  if (filters.type) query.type = filters.type;
  if (filters.featured !== undefined) query.featured = filters.featured;

  const [documents, total] = await Promise.all([
    Destination.find(query)
      .select('-description -gallery')
      .sort({ sortOrder: 1, name: 1 })
      .skip(offsetFor(filters.page, filters.limit))
      .limit(filters.limit)
      .lean(),
    Destination.countDocuments(query),
  ]);

  // One grouped count instead of N per-destination queries.
  const counts = await packageCountsByDestination(documents.map((d) => d._id));

  return {
    destinations: documents.map((document) =>
      toDestinationDTO({
        ...document,
        packageCount: counts.get(String(document._id)) ?? 0,
      }),
    ),
    total,
  };
}

export async function getPublishedDestinationBySlug(
  slug: string,
): Promise<DestinationDTO> {
  await connectToDatabase();

  const document = await Destination.findOne({ slug, status: 'published' }).lean();
  if (!document) throw notFound('Destination');

  const counts = await packageCountsByDestination([document._id]);

  return toDestinationDTO({
    ...document,
    packageCount: counts.get(String(document._id)) ?? 0,
  });
}

export async function getFeaturedDestinations(limit = 8): Promise<DestinationDTO[]> {
  await connectToDatabase();

  const documents = await Destination.find({ status: 'published', featured: true })
    .select('-description -gallery')
    .sort({ sortOrder: 1 })
    .limit(limit)
    .lean();

  const counts = await packageCountsByDestination(documents.map((d) => d._id));

  return documents.map((document) =>
    toDestinationDTO({
      ...document,
      packageCount: counts.get(String(document._id)) ?? 0,
    }),
  );
}

export async function listPublishedCategories(): Promise<CategoryDTO[]> {
  await connectToDatabase();

  const documents = await Category.find({ status: 'published' })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  return documents.map(toCategoryDTO);
}

/** Aggregates published-package counts per destination in a single round trip. */
async function packageCountsByDestination(
  ids: unknown[],
): Promise<Map<string, number>> {
  if (ids.length === 0) return new Map();

  const rows = await TourPackage.aggregate<{ _id: unknown; count: number }>([
    { $match: { status: 'published', destinationIds: { $in: ids } } },
    { $unwind: '$destinationIds' },
    { $match: { destinationIds: { $in: ids } } },
    { $group: { _id: '$destinationIds', count: { $sum: 1 } } },
  ]);

  return new Map(rows.map((row) => [String(row._id), row.count]));
}
