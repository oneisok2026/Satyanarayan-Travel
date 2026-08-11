import 'server-only';

import { randomUUID } from 'node:crypto';
import { getStorage } from 'firebase-admin/storage';
import { getAdminApp } from './admin';
import { serverEnv } from '@/lib/env';
import { serviceUnavailable } from '@/lib/errors';
import { logger } from '@/lib/logger';

/**
 * Firebase Storage — server only.
 *
 * Uploads go through the Admin SDK rather than the Web SDK on purpose: the
 * browser never receives write credentials, so the only way to put an object
 * in the bucket is through an authenticated admin route that has already
 * validated the file's magic bytes.
 *
 * Objects are made publicly readable, because they are cover images on public
 * pages. Nothing private is ever written here.
 */

/**
 * Bucket name, preferring the server-only value and falling back to the
 * public one so a single-bucket project needs no extra configuration.
 */
export function storageBucketName(): string {
  const configured =
    serverEnv().FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    '';

  // Consoles show either "project.appspot.com" or a gs:// URI; accept both.
  return configured.replace(/^gs:\/\//, '').replace(/\/+$/, '');
}

export function isStorageConfigured(): boolean {
  try {
    return storageBucketName() !== '';
  } catch {
    return false;
  }
}

/** Inferred so the transitive @google-cloud/storage types are not imported directly. */
type Bucket = ReturnType<ReturnType<typeof getStorage>['bucket']>;

function getBucket(): Bucket {
  const name = storageBucketName();
  if (!name) {
    throw serviceUnavailable(
      'File uploads are not configured. Set FIREBASE_STORAGE_BUCKET and try again.',
    );
  }
  return getStorage(getAdminApp()).bucket(name);
}

export interface StoredObject {
  url: string;
  path: string;
  sizeBytes: number;
  contentType: string;
}

interface UploadOptions {
  buffer: Buffer;
  contentType: string;
  /** Storage prefix, already validated against UPLOAD_FOLDERS. */
  folder: string;
  /** Sanitized base name, without extension. */
  baseName: string;
  extension: string;
}

/**
 * Writes a validated buffer to the bucket and returns its public URL.
 *
 * The object name carries a random segment so two admins uploading
 * "cover.jpg" a second apart cannot overwrite each other, and so a guessed
 * name cannot be used to replace an existing image.
 */
export async function uploadPublicObject({
  buffer,
  contentType,
  folder,
  baseName,
  extension,
}: UploadOptions): Promise<StoredObject> {
  const bucket = getBucket();
  const path = `${folder}/${Date.now()}-${randomUUID().slice(0, 8)}-${baseName}.${extension}`;
  const file = bucket.file(path);

  // The download token makes the object readable through the
  // firebasestorage.googleapis.com host, which is already allowed in
  // next.config.mjs remotePatterns.
  const downloadToken = randomUUID();

  await file.save(buffer, {
    resumable: false,
    contentType,
    metadata: {
      contentType,
      // Content-addressed names never change, so they can be cached hard.
      cacheControl: 'public, max-age=31536000, immutable',
      metadata: { firebaseStorageDownloadTokens: downloadToken },
    },
  });

  return {
    url:
      `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/` +
      `${encodeURIComponent(path)}?alt=media&token=${downloadToken}`,
    path,
    sizeBytes: buffer.byteLength,
    contentType,
  };
}

/**
 * Best-effort delete of a previously uploaded object.
 *
 * Never throws: a replaced image failing to delete leaves an orphan in the
 * bucket, which is far preferable to failing the save the admin asked for.
 */
export async function deleteObject(path: string): Promise<void> {
  try {
    await getBucket().file(path).delete({ ignoreNotFound: true });
  } catch (error) {
    logger.warn('storage.delete failed', { path, error });
  }
}

/**
 * Extracts the object path from a URL this module produced.
 *
 * Returns null for anything else — an externally hosted image must never be
 * treated as ours to delete.
 */
export function objectPathFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'firebasestorage.googleapis.com') return null;

    const match = parsed.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);
    if (!match) return null;
    if (match[1] !== storageBucketName()) return null;

    return decodeURIComponent(match[2] as string);
  } catch {
    return null;
  }
}
