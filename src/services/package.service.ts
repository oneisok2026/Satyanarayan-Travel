import 'server-only';

import type { FilterQuery } from 'mongoose';
import { connectToDatabase } from '@/lib/db/connect';
import { TourPackage, type TourPackageAttributes } from '@/models/TourPackage';
import { Destination } from '@/models/Destination';
import { Category } from '@/models/Category';
import { notFound } from '@/lib/errors';
import { buildSearchRegex, toObjectId } from '@/lib/security/sanitize';
import { offsetFor } from '@/lib/validation/common.schema';
import type { PackageType } from '@/constants';
import type { TourPackageDTO, TourPackageSummaryDTO } from '@/types';
import { toPackageDTO, toPackageSummaryDTO } from './mappers';

/**
 * Tour package queries.
 *
 * Public reads are always constrained to `status: 'published'` inside this
 * module, so a caller cannot accidentally leak drafts by forgetting a filter.
 */

export interface PackageListFilters {
  type?: PackageType;
  destinationSlug?: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  minNights?: number;
  maxNights?: number;
  featured?: boolean;
  search?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'duration_asc' | 'rating';
  page: number;
  limit: number;
}

export interface PackageListResult {
  packages: TourPackageSummaryDTO[];
  total: number;
}

const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  duration_asc: { 'duration.nights': 1 },
  rating: { 'rating.average': -1, 'rating.count': -1 },
} as const;

/** Fields needed by a listing card. Excludes itinerary/description bodies. */
const SUMMARY_FIELDS =
  'title slug type destinationIds categoryId shortDescription coverImage duration price compareAtPrice priceNote featured rating';

export async function listPublishedPackages(
  filters: PackageListFilters,
): Promise<PackageListResult> {
  await connectToDatabase();

  const query: FilterQuery<TourPackageAttributes> = { status: 'published' };

  if (filters.type) query.type = filters.type;
  if (filters.featured !== undefined) query.featured = filters.featured;

  if (filters.destinationSlug) {
    const destination = await Destination.findOne({
      slug: filters.destinationSlug,
      status: 'published',
    })
      .select('_id')
      .lean();
    // An unknown destination must yield an empty page, not every package.
    if (!destination) return { packages: [], total: 0 };
    query.destinationIds = destination._id;
  }

  if (filters.categorySlug) {
    const category = await Category.findOne({
      slug: filters.categorySlug,
      status: 'published',
    })
      .select('_id')
      .lean();
    if (!category) return { packages: [], total: 0 };
    query.categoryId = category._id;
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    query.price = {};
    if (filters.minPrice !== undefined) query.price.$gte = filters.minPrice;
    if (filters.maxPrice !== undefined) query.price.$lte = filters.maxPrice;
  }

  if (filters.minNights !== undefined || filters.maxNights !== undefined) {
    query['duration.nights'] = {};
    if (filters.minNights !== undefined)
      query['duration.nights'].$gte = filters.minNights;
    if (filters.maxNights !== undefined)
      query['duration.nights'].$lte = filters.maxNights;
  }

  if (filters.search) {
    const regex = buildSearchRegex(filters.search);
    query.$or = [{ title: regex }, { shortDescription: regex }];
  }

  const sort = SORTS[filters.sort ?? 'newest'];

  // countDocuments runs in parallel — the total is needed for pagination meta.
  const [documents, total] = await Promise.all([
    TourPackage.find(query)
      .select(SUMMARY_FIELDS)
      .populate('destinationIds', 'name slug')
      .populate('categoryId', 'name slug')
      .sort(sort)
      .skip(offsetFor(filters.page, filters.limit))
      .limit(filters.limit)
      .lean(),
    TourPackage.countDocuments(query),
  ]);

  return {
    packages: documents.map(toPackageSummaryDTO),
    total,
  };
}

export async function getPublishedPackageBySlug(
  slug: string,
): Promise<TourPackageDTO> {
  await connectToDatabase();

  const document = await TourPackage.findOne({ slug, status: 'published' })
    .populate('destinationIds', 'name slug')
    .populate('categoryId', 'name slug')
    .lean();

  if (!document) throw notFound('Package');
  return toPackageDTO(document);
}

/**
 * Related packages: same destination first, then same type, never itself.
 */
export async function getRelatedPackages(
  packageId: string,
  limit = 3,
): Promise<TourPackageSummaryDTO[]> {
  await connectToDatabase();

  const current = await TourPackage.findById(toObjectId(packageId))
    .select('destinationIds type')
    .lean();

  if (!current) return [];

  const documents = await TourPackage.find({
    _id: { $ne: current._id },
    status: 'published',
    $or: [{ destinationIds: { $in: current.destinationIds } }, { type: current.type }],
  })
    .select(SUMMARY_FIELDS)
    .populate('destinationIds', 'name slug')
    .populate('categoryId', 'name slug')
    .sort({ featured: -1, 'rating.average': -1 })
    .limit(limit)
    .lean();

  return documents.map(toPackageSummaryDTO);
}

export async function getFeaturedPackages(limit = 6): Promise<TourPackageSummaryDTO[]> {
  await connectToDatabase();

  const documents = await TourPackage.find({ status: 'published', featured: true })
    .select(SUMMARY_FIELDS)
    .populate('destinationIds', 'name slug')
    .populate('categoryId', 'name slug')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return documents.map(toPackageSummaryDTO);
}

/** Server-authoritative price lookup. Booking must never trust a client total. */
export async function getPackagePricing(packageId: string): Promise<{
  id: string;
  title: string;
  slug: string;
  price: number;
  childPrice: number;
  status: string;
}> {
  await connectToDatabase();

  const document = await TourPackage.findById(toObjectId(packageId, 'packageId'))
    .select('title slug price childPrice status')
    .lean();

  if (!document || document.status !== 'published') {
    throw notFound('Package');
  }

  return {
    id: String(document._id),
    title: document.title,
    slug: document.slug,
    price: document.price,
    childPrice: document.childPrice ?? 0,
    status: document.status,
  };
}
