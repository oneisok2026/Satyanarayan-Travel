import 'server-only';

import type { FilterQuery } from 'mongoose';
import { connectToDatabase } from '@/lib/db/connect';
import { BlogPost, type BlogPostAttributes } from '@/models/BlogPost';
import { GalleryItem } from '@/models/GalleryItem';
import { HeroSlide } from '@/models/HeroSlide';
import { SocialLink } from '@/models/SocialLink';
import { Service } from '@/models/Service';
import { notFound } from '@/lib/errors';
import { buildSearchRegex, toObjectId } from '@/lib/security/sanitize';
import { offsetFor } from '@/lib/validation/common.schema';
import type { BlogPostDTO, GalleryItemDTO, ServiceDTO } from '@/types';
import type { SocialPlatform } from '@/constants';
import {
  toBlogPostDTO,
  toBlogSummaryDTO,
  toGalleryItemDTO,
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

/**
 * Published homepage hero slides, in display order.
 *
 * Returns a plain shape rather than the Mongoose document: the slider is a
 * Client Component, and ObjectId/Date instances cannot cross that boundary.
 */
export async function listHeroSlides(): Promise<
  {
    id: string;
    imageUrl: string;
    imageAlt: string;
    eyebrow?: string;
    headline: string;
    headlineAccent?: string;
    subheadline?: string;
    ctaLabel?: string;
    ctaHref?: string;
    secondaryCtaLabel?: string;
    secondaryCtaHref?: string;
  }[]
> {
  await connectToDatabase();

  const documents = await HeroSlide.find({ status: 'published' })
    .sort({ sortOrder: 1, createdAt: 1 })
    // More than a handful and the rotation outlasts the time anyone spends
    // above the fold.
    .limit(6)
    .lean();

  return documents.map((document) => ({
    id: String(document._id),
    imageUrl: document.image.url,
    imageAlt: document.image.alt || document.headline,
    eyebrow: document.eyebrow || undefined,
    headline: document.headline,
    headlineAccent: document.headlineAccent || undefined,
    subheadline: document.subheadline || undefined,
    ctaLabel: document.ctaLabel || undefined,
    ctaHref: document.ctaHref || undefined,
    secondaryCtaLabel: document.secondaryCtaLabel || undefined,
    secondaryCtaHref: document.secondaryCtaHref || undefined,
  }));
}

/**
 * Published social links for the header, in display order.
 *
 * Plain objects rather than Mongoose documents: the header renders these in a
 * layout shared by every page, and ObjectId/Date cannot cross into a Client
 * Component.
 */
export async function listSocialLinks(): Promise<
  { id: string; platform: SocialPlatform; url: string; label?: string }[]
> {
  await connectToDatabase();

  const documents = await SocialLink.find({ status: 'published' })
    .sort({ sortOrder: 1, createdAt: 1 })
    .limit(10)
    .lean();

  return documents.map((document) => ({
    id: String(document._id),
    platform: document.platform,
    url: document.url,
    label: document.label || undefined,
  }));
}
