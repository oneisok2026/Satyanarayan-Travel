import 'server-only';

import type { FilterQuery } from 'mongoose';
import { connectToDatabase } from '@/lib/db/connect';
import { BlogPost, type BlogPostAttributes } from '@/models/BlogPost';
import { GalleryItem } from '@/models/GalleryItem';
import { Service } from '@/models/Service';
import { Review } from '@/models/Review';
import { TourPackage } from '@/models/TourPackage';
import { Booking } from '@/models/Booking';
import { notFound, conflict } from '@/lib/errors';
import { buildSearchRegex, toObjectId } from '@/lib/security/sanitize';
import { offsetFor } from '@/lib/validation/common.schema';
import type { BlogPostDTO, GalleryItemDTO, ReviewDTO, ServiceDTO } from '@/types';
import {
  toBlogPostDTO,
  toBlogSummaryDTO,
  toGalleryItemDTO,
  toReviewDTO,
  toServiceDTO,
} from './mappers';

// -------------------------------------------------------------------- blog --

export interface BlogListFilters {
  category?: string;
  tag?: string;
  search?: string;
  page: number;
  limit: number;
}

export async function listPublishedPosts(filters: BlogListFilters) {
  await connectToDatabase();

  const query: FilterQuery<BlogPostAttributes> = {
    status: 'published',
    // A post scheduled for the future must not appear early.
    publishedAt: { $lte: new Date() },
  };

  if (filters.category) query.category = filters.category;
  if (filters.tag) query.tags = filters.tag;
  if (filters.search) {
    const regex = buildSearchRegex(filters.search);
    query.$or = [{ title: regex }, { excerpt: regex }];
  }

  const [documents, total] = await Promise.all([
    BlogPost.find(query)
      .select('-content')
      .sort({ publishedAt: -1 })
      .skip(offsetFor(filters.page, filters.limit))
      .limit(filters.limit)
      .lean(),
    BlogPost.countDocuments(query),
  ]);

  return { posts: documents.map(toBlogSummaryDTO), total };
}

export async function getPublishedPostBySlug(slug: string): Promise<BlogPostDTO> {
  await connectToDatabase();

  const document = await BlogPost.findOne({
    slug,
    status: 'published',
    publishedAt: { $lte: new Date() },
  }).lean();

  if (!document) throw notFound('Article');

  // Fire-and-forget: a view counter must never delay or fail the page.
  BlogPost.updateOne({ _id: document._id }, { $inc: { viewCount: 1 } })
    .exec()
    .catch(() => undefined);

  return toBlogPostDTO(document);
}

export async function getRelatedPosts(postId: string, limit = 3) {
  await connectToDatabase();

  const current = await BlogPost.findById(toObjectId(postId))
    .select('category tags')
    .lean();
  if (!current) return [];

  const documents = await BlogPost.find({
    _id: { $ne: current._id },
    status: 'published',
    publishedAt: { $lte: new Date() },
    $or: [{ category: current.category }, { tags: { $in: current.tags ?? [] } }],
  })
    .select('-content')
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean();

  return documents.map(toBlogSummaryDTO);
}

// ----------------------------------------------------------------- gallery --

export async function listGalleryItems(
  albumSlug: string | undefined,
  page: number,
  limit: number,
): Promise<{ items: GalleryItemDTO[]; total: number; albums: string[] }> {
  await connectToDatabase();

  const query: Record<string, unknown> = { status: 'published' };
  if (albumSlug) query.albumSlug = albumSlug;

  const [documents, total, albums] = await Promise.all([
    GalleryItem.find(query)
      .sort({ sortOrder: 1, createdAt: -1 })
      .skip(offsetFor(page, limit))
      .limit(limit)
      .lean(),
    GalleryItem.countDocuments(query),
    GalleryItem.distinct('album', { status: 'published' }),
  ]);

  return {
    items: documents.map(toGalleryItemDTO),
    total,
    albums: albums as string[],
  };
}

// ---------------------------------------------------------------- services --

export async function listPublishedServices(): Promise<ServiceDTO[]> {
  await connectToDatabase();

  const documents = await Service.find({ status: 'published' })
    .sort({ sortOrder: 1 })
    .lean();

  return documents.map(toServiceDTO);
}

export async function getPublishedServiceBySlug(slug: string): Promise<ServiceDTO> {
  await connectToDatabase();

  const document = await Service.findOne({ slug, status: 'published' }).lean();
  if (!document) throw notFound('Service');

  return toServiceDTO(document);
}

// ----------------------------------------------------------------- reviews --

export async function listApprovedReviews(
  packageId: string | undefined,
  page: number,
  limit: number,
): Promise<{ reviews: ReviewDTO[]; total: number }> {
  await connectToDatabase();

  const query: Record<string, unknown> = { status: 'approved' };
  if (packageId) query.packageId = toObjectId(packageId, 'packageId');

  const [documents, total] = await Promise.all([
    Review.find(query)
      .populate('packageId', 'title slug')
      .sort({ createdAt: -1 })
      .skip(offsetFor(page, limit))
      .limit(limit)
      .lean(),
    Review.countDocuments(query),
  ]);

  return { reviews: documents.map(toReviewDTO), total };
}

export interface CreateReviewInput {
  userId: string;
  userName: string;
  userPhoto?: string;
  packageId: string;
  rating: number;
  title?: string;
  comment: string;
  travelDate?: Date;
}

/**
 * Submits a review for moderation.
 *
 * Requires a completed booking for the package, which is what stops a random
 * account from rating a package it never travelled on.
 */
export async function createReview(input: CreateReviewInput): Promise<ReviewDTO> {
  await connectToDatabase();

  const packageObjectId = toObjectId(input.packageId, 'packageId');

  const exists = await TourPackage.exists({ _id: packageObjectId });
  if (!exists) throw notFound('Package');

  const completedBooking = await Booking.exists({
    userId: toObjectId(input.userId),
    packageId: packageObjectId,
    status: { $in: ['confirmed', 'completed'] },
  });

  if (!completedBooking) {
    throw conflict('You can review a package after travelling with us on it.');
  }

  const alreadyReviewed = await Review.exists({
    userId: toObjectId(input.userId),
    packageId: packageObjectId,
  });

  if (alreadyReviewed) {
    throw conflict('You have already reviewed this package.');
  }

  const review = await Review.create({
    userId: toObjectId(input.userId),
    packageId: packageObjectId,
    authorName: input.userName,
    authorPhoto: input.userPhoto,
    rating: input.rating,
    title: input.title,
    comment: input.comment,
    travelDate: input.travelDate,
    verifiedBooking: true,
    status: 'pending',
  });

  return toReviewDTO(review.toObject());
}

/**
 * Applies a moderation decision and refreshes the package's denormalized
 * rating from approved reviews only.
 */
export async function moderateReview(
  reviewId: string,
  decision: 'approved' | 'rejected',
  moderatorId: string,
  reason?: string,
): Promise<{ previous: string; review: ReviewDTO }> {
  await connectToDatabase();

  const review = await Review.findById(toObjectId(reviewId));
  if (!review) throw notFound('Review');

  const previous = review.status;
  review.status = decision;
  review.moderatedBy = toObjectId(moderatorId);
  review.moderatedAt = new Date();
  if (reason) review.rejectionReason = reason;
  await review.save();

  if (review.packageId) {
    await recalculatePackageRating(String(review.packageId));
  }

  return { previous, review: toReviewDTO(review.toObject()) };
}

export async function recalculatePackageRating(packageId: string): Promise<void> {
  const objectId = toObjectId(packageId);

  const [result] = await Review.aggregate<{ average: number; count: number }>([
    { $match: { packageId: objectId, status: 'approved' } },
    {
      $group: {
        _id: null,
        average: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  await TourPackage.updateOne(
    { _id: objectId },
    {
      $set: {
        'rating.average': result ? Math.round(result.average * 10) / 10 : 0,
        'rating.count': result?.count ?? 0,
      },
    },
  );
}

export async function listUserReviews(userId: string): Promise<ReviewDTO[]> {
  await connectToDatabase();

  const documents = await Review.find({ userId: toObjectId(userId) })
    .populate('packageId', 'title slug')
    .sort({ createdAt: -1 })
    .lean();

  return documents.map(toReviewDTO);
}
