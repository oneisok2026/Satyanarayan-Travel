import 'server-only';

import type { Model } from 'mongoose';
import { connectToDatabase } from '@/lib/db/connect';
import { TourPackage } from '@/models/TourPackage';
import { Destination } from '@/models/Destination';
import { Category } from '@/models/Category';
import { Service } from '@/models/Service';
import { BlogPost } from '@/models/BlogPost';
import { GalleryItem } from '@/models/GalleryItem';
import { Booking } from '@/models/Booking';
import { toObjectId } from '@/lib/security/sanitize';
import { conflict, notFound } from '@/lib/errors';
import { deleteObject, objectPathFromUrl } from '@/lib/firebase/storage';
import type { ContentStatus } from '@/constants';

/**
 * Admin write operations for catalogue and content collections.
 *
 * One service rather than five: the resources differ only in their model and
 * a few referential-integrity rules, so a single implementation keeps status
 * changes, slug uniqueness and delete guards consistent everywhere.
 */

export const CATALOGUE_RESOURCES = {
  packages: { model: TourPackage, label: 'Package', audit: 'package' },
  destinations: { model: Destination, label: 'Destination', audit: 'destination' },
  categories: { model: Category, label: 'Category', audit: 'category' },
  services: { model: Service, label: 'Service', audit: 'service' },
  blogs: { model: BlogPost, label: 'Article', audit: 'blog' },
  gallery: { model: GalleryItem, label: 'Gallery item', audit: 'gallery' },
} as const;

export type CatalogueResource = keyof typeof CATALOGUE_RESOURCES;

export function isCatalogueResource(value: string): value is CatalogueResource {
  return value in CATALOGUE_RESOURCES;
}

// The models have different attribute shapes; this service only touches the
// fields they share (slug, status, featured), so a loose model type is
// appropriate here and every payload is schema-validated before it arrives.
type AnyModel = Model<Record<string, unknown>>;

function modelFor(resource: CatalogueResource): AnyModel {
  return CATALOGUE_RESOURCES[resource].model as unknown as AnyModel;
}

export function labelFor(resource: CatalogueResource): string {
  return CATALOGUE_RESOURCES[resource].label;
}

/**
 * Converts a lean document into plain JSON values.
 *
 * `.lean()` still returns ObjectId and Date instances, which cannot cross
 * into a Client Component — React refuses anything carrying a toJSON method.
 * This walks the document once and replaces them with strings.
 */
export function serializeDocument(value: unknown, depth = 0): unknown {
  if (value == null || depth > 12) return value;

  if (value instanceof Date) return value.toISOString();

  // ObjectId and Buffer both report as objects; both serialize to a string.
  if (typeof value === 'object' && 'toHexString' in value) {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => serializeDocument(entry, depth + 1));
  }

  if (typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      output[key] = serializeDocument(entry, depth + 1);
    }
    return output;
  }

  return value;
}

/**
 * Fetches one record for editing, including unpublished ones.
 *
 * Returned as plain JSON so the result can be handed straight to the edit
 * form, which is a Client Component.
 */
export async function getCatalogueItem(
  resource: CatalogueResource,
  id: string,
): Promise<Record<string, unknown>> {
  await connectToDatabase();

  const document = await modelFor(resource)
    .findById(toObjectId(id))
    .lean<Record<string, unknown>>();

  if (!document) throw notFound(labelFor(resource));

  return serializeDocument(document) as Record<string, unknown>;
}

/** Rejects a slug already used by a different record. */
async function assertSlugAvailable(
  resource: CatalogueResource,
  slug: string,
  excludeId?: string,
): Promise<void> {
  const query: Record<string, unknown> = { slug };
  if (excludeId) query._id = { $ne: toObjectId(excludeId) };

  const clash = await modelFor(resource).exists(query);
  if (clash) {
    throw conflict('That URL slug is already in use', {
      slug: ['Already in use by another entry'],
    });
  }
}

export async function createCatalogueItem(
  resource: CatalogueResource,
  data: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  await connectToDatabase();

  if (typeof data.slug === 'string') {
    await assertSlugAvailable(resource, data.slug);
  }

  const created = await modelFor(resource).create(data);
  return serializeDocument(created.toObject()) as Record<string, unknown>;
}

export async function updateCatalogueItem(
  resource: CatalogueResource,
  id: string,
  data: Record<string, unknown>,
): Promise<{ before: Record<string, unknown>; after: Record<string, unknown> }> {
  await connectToDatabase();

  const before = await modelFor(resource)
    .findById(toObjectId(id))
    .lean<Record<string, unknown>>();

  if (!before) throw notFound(labelFor(resource));

  if (typeof data.slug === 'string') {
    await assertSlugAvailable(resource, data.slug, id);
  }

  const after = await modelFor(resource)
    .findByIdAndUpdate(toObjectId(id), { $set: data }, {
      new: true,
      runValidators: true,
    })
    .lean<Record<string, unknown>>();

  if (!after) throw notFound(labelFor(resource));

  return {
    before: serializeDocument(before) as Record<string, unknown>,
    after: serializeDocument(after) as Record<string, unknown>,
  };
}

/**
 * Changes publication status.
 *
 * "Hide" maps to `archived` rather than deleting: the record keeps its slug,
 * its history and any bookings that reference it, and disappears from every
 * public query because those pin `status: 'published'`.
 */
export async function setCatalogueStatus(
  resource: CatalogueResource,
  id: string,
  status: ContentStatus,
): Promise<{ previous: ContentStatus; slug: string; title: string }> {
  await connectToDatabase();

  const document = await modelFor(resource)
    .findById(toObjectId(id))
    .lean<Record<string, unknown>>();

  if (!document) throw notFound(labelFor(resource));

  const previous = document.status as ContentStatus;

  await modelFor(resource).updateOne(
    { _id: toObjectId(id) },
    {
      $set: {
        status,
        // Blog posts need a publish timestamp the first time they go live.
        ...(resource === 'blogs' && status === 'published' && !document.publishedAt
          ? { publishedAt: new Date() }
          : {}),
      },
    },
  );

  return {
    previous,
    slug: String(document.slug ?? ''),
    title: String(document.title ?? document.name ?? ''),
  };
}

export async function setCatalogueFeatured(
  resource: CatalogueResource,
  id: string,
  featured: boolean,
): Promise<{ previous: boolean; title: string }> {
  await connectToDatabase();

  const document = await modelFor(resource)
    .findById(toObjectId(id))
    .lean<Record<string, unknown>>();

  if (!document) throw notFound(labelFor(resource));

  await modelFor(resource).updateOne({ _id: toObjectId(id) }, { $set: { featured } });

  return {
    previous: Boolean(document.featured),
    title: String(document.title ?? document.name ?? ''),
  };
}

/**
 * Permanently deletes a record.
 *
 * Refuses when the record is referenced by live data — a package with
 * bookings, or a destination or category still used by packages. Deleting
 * those would leave orphaned references and break existing customer records,
 * so the admin is told to hide the entry instead.
 */
export async function deleteCatalogueItem(
  resource: CatalogueResource,
  id: string,
): Promise<{ title: string; slug: string }> {
  await connectToDatabase();

  const objectId = toObjectId(id);

  const document = await modelFor(resource)
    .findById(objectId)
    .lean<Record<string, unknown>>();

  if (!document) throw notFound(labelFor(resource));

  if (resource === 'packages') {
    const bookingCount = await Booking.countDocuments({ packageId: objectId });
    if (bookingCount > 0) {
      throw conflict(
        `This package has ${bookingCount} ${bookingCount === 1 ? 'booking' : 'bookings'} and cannot be deleted. Hide it instead to remove it from the website.`,
      );
    }
  }

  if (resource === 'destinations') {
    const packageCount = await TourPackage.countDocuments({ destinationIds: objectId });
    if (packageCount > 0) {
      throw conflict(
        `${packageCount} ${packageCount === 1 ? 'package uses' : 'packages use'} this destination. Remove it from those packages first, or hide it instead.`,
      );
    }
  }

  if (resource === 'categories') {
    const packageCount = await TourPackage.countDocuments({ categoryId: objectId });
    if (packageCount > 0) {
      throw conflict(
        `${packageCount} ${packageCount === 1 ? 'package uses' : 'packages use'} this category. Reassign those packages first, or hide it instead.`,
      );
    }
  }

  await modelFor(resource).deleteOne({ _id: objectId });

  // A gallery item exists only for its image, so removing the record without
  // the file would leave an unreachable object paying for storage forever.
  // Best-effort and after the delete: an orphaned file is far better than a
  // failed deletion the admin has to retry.
  if (resource === 'gallery') {
    const image = document.image as { url?: string } | undefined;
    if (image?.url) {
      const path = objectPathFromUrl(image.url);
      if (path) await deleteObject(path);
    }
  }

  return {
    title: String(document.title ?? document.name ?? document.caption ?? ''),
    slug: String(document.slug ?? ''),
  };
}
