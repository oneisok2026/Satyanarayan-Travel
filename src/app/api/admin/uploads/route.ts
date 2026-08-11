import type { NextRequest } from 'next/server';
import { route } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { requireSuperAdmin } from '@/lib/firebase/auth';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import { validateImageUpload, uploadBaseName } from '@/lib/security/upload';
import { uploadPublicObject, isStorageConfigured } from '@/lib/firebase/storage';
import {
  validationError,
  serviceUnavailable,
  AppError,
  ERROR_CODES,
} from '@/lib/errors';
import { UPLOAD_FOLDERS, UPLOAD_LIMITS } from '@/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST — upload an image from the admin's device.
 *
 * super_admin only, matching the rest of the catalogue write surface. The
 * order of checks matters: authenticate first so an anonymous request is
 * rejected before the body is read at all, then rate limit per admin, and
 * only then buffer the file.
 *
 * Everything about the file that the client asserts (name, MIME type, size
 * header) is treated as untrusted. `validateImageUpload` re-derives the type
 * from magic bytes and `uploadBaseName` reduces the name to an allowlisted
 * character set before it is used in an object path.
 */
export const POST = route('POST /api/admin/uploads', async (request: NextRequest) => {
  const admin = await requireSuperAdmin();

  if (!isStorageConfigured()) {
    throw serviceUnavailable(
      'File uploads are not configured yet. Paste an image URL instead.',
    );
  }

  enforceRateLimit('upload', String(admin._id));

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('multipart/form-data')) {
    throw validationError('Expected a multipart form upload');
  }

  // Cheap pre-check on the declared length, so an obviously oversized body is
  // refused before it is buffered. The real limit is enforced below against
  // the file itself, since this header is client-supplied.
  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > UPLOAD_LIMITS.maxImageBytes * 1.1) {
    throw new AppError(
      ERROR_CODES.PAYLOAD_TOO_LARGE,
      `Images must be ${Math.round(UPLOAD_LIMITS.maxImageBytes / 1024 / 1024)} MB or smaller`,
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw validationError('The upload could not be read. Please try again.');
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    throw validationError('No file was attached', { file: ['Choose an image to upload'] });
  }

  const folder = String(form.get('folder') ?? '');
  if (!UPLOAD_FOLDERS.includes(folder as never)) {
    throw validationError('Unknown upload folder');
  }

  const validated = await validateImageUpload(file);

  const baseName = uploadBaseName(file.name);

  const stored = await uploadPublicObject({
    buffer: validated.buffer,
    contentType: validated.mimeType,
    folder,
    baseName,
    extension: validated.extension,
  });

  return apiSuccess(
    {
      url: stored.url,
      path: stored.path,
      sizeBytes: stored.sizeBytes,
      contentType: stored.contentType,
    },
    { status: 201, message: 'Image uploaded.' },
  );
});

/** GET — capability probe, so the form can hide the upload control cleanly. */
export const GET = route('GET /api/admin/uploads', async () => {
  await requireSuperAdmin();

  return apiSuccess({
    enabled: isStorageConfigured(),
    maxBytes: UPLOAD_LIMITS.maxImageBytes,
    allowedTypes: UPLOAD_LIMITS.allowedImageTypes,
  });
});
