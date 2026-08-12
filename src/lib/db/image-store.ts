import 'server-only';

import { Types, mongo } from 'mongoose';
import { connectToDatabase } from './connect';
import { serviceUnavailable, notFound } from '@/lib/errors';
import { logger } from '@/lib/logger';

/**
 * Image storage in MongoDB, via GridFS.
 *
 * GridFS rather than a Buffer field on a document: a BSON document is capped
 * at 16 MB, and reading one pulls the whole image into memory. GridFS splits
 * the file across a chunks collection, so images stream out and byte-range
 * requests can be served without loading the entire file.
 *
 * Objects are addressed by their ObjectId and served through
 * /api/images/[id]. Nothing here is private — these are cover images on
 * public pages — but the write path is still admin-only, and the bytes are
 * validated from their magic numbers before they ever reach this module.
 */

const BUCKET_NAME = 'images';

/** Two collections back the bucket: images.files and images.chunks. */
async function getBucket(): Promise<mongo.GridFSBucket> {
  const connection = await connectToDatabase();
  const db = connection.connection.db;

  if (!db) {
    throw serviceUnavailable('The database connection is not ready. Please try again.');
  }

  return new mongo.GridFSBucket(db, { bucketName: BUCKET_NAME });
}

export interface StoredImage {
  /** Application-relative URL, safe to persist on a document. */
  url: string;
  /** GridFS file id, as a hex string. */
  id: string;
  sizeBytes: number;
  contentType: string;
}

interface StoreOptions {
  buffer: Buffer;
  contentType: string;
  /** Logical grouping, kept in metadata for housekeeping and auditing. */
  folder: string;
  /** Sanitized base name, without extension. */
  baseName: string;
  extension: string;
}

/**
 * Writes validated bytes to GridFS and returns the URL to store on the record.
 *
 * The returned URL is relative, so the same database works behind localhost,
 * a preview deployment and the production domain without rewriting stored
 * values.
 */
export async function storeImage({
  buffer,
  contentType,
  folder,
  baseName,
  extension,
}: StoreOptions): Promise<StoredImage> {
  const bucket = await getBucket();
  const filename = `${folder}/${baseName}.${extension}`;

  const uploadStream = bucket.openUploadStream(filename, {
    contentType,
    metadata: { folder, uploadedAt: new Date() },
  });

  await new Promise<void>((resolve, reject) => {
    uploadStream.on('error', reject);
    uploadStream.on('finish', () => resolve());
    uploadStream.end(buffer);
  });

  const id = uploadStream.id as Types.ObjectId;

  return {
    url: `/api/images/${id.toHexString()}`,
    id: id.toHexString(),
    sizeBytes: buffer.byteLength,
    contentType,
  };
}

export interface ImageRecord {
  stream: NodeJS.ReadableStream;
  contentType: string;
  sizeBytes: number;
  /** Stable across reads, so it can be used as a strong ETag. */
  uploadDate: Date;
}

/** Opens a read stream for serving, or throws NOT_FOUND for an unknown id. */
export async function openImage(id: string): Promise<ImageRecord> {
  if (!Types.ObjectId.isValid(id)) throw notFound('Image');

  const bucket = await getBucket();
  const objectId = new Types.ObjectId(id);

  const [file] = await bucket.find({ _id: objectId }).limit(1).toArray();
  if (!file) throw notFound('Image');

  return {
    stream: bucket.openDownloadStream(objectId),
    contentType: file.contentType ?? 'application/octet-stream',
    sizeBytes: file.length,
    uploadDate: file.uploadDate,
  };
}

/**
 * Best-effort delete.
 *
 * Never throws: a replaced image failing to delete leaves an orphan, which is
 * preferable to failing the save the admin actually asked for.
 */
export async function deleteImage(id: string): Promise<void> {
  if (!Types.ObjectId.isValid(id)) return;

  try {
    const bucket = await getBucket();
    await bucket.delete(new Types.ObjectId(id));
  } catch (error) {
    // A missing file is the expected case when a record is deleted twice.
    logger.warn('image delete failed', { id, error });
  }
}

/**
 * Extracts the GridFS id from a URL this module produced.
 *
 * Returns null for anything else, so an externally hosted image — an Unsplash
 * link, or a legacy Firebase URL — is never treated as ours to delete.
 */
export function imageIdFromUrl(url: string): string | null {
  const match = url.match(/^\/api\/images\/([a-f0-9]{24})$/i);
  return match ? (match[1] as string) : null;
}
