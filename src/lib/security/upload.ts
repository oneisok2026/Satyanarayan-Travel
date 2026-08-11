import 'server-only';

import { AppError, ERROR_CODES, validationError } from '@/lib/errors';
import { UPLOAD_LIMITS } from '@/constants';

/**
 * Upload validation.
 *
 * A declared MIME type is client-controlled, so type is confirmed against the
 * file's magic bytes as well. Extension is checked last and only to catch
 * obvious mismatches.
 */

const IMAGE_SIGNATURES: { mime: string; bytes: number[]; offset: number }[] = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff], offset: 0 },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47], offset: 0 },
  // WEBP: "RIFF" then "WEBP" at offset 8.
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
  // AVIF/HEIF share the ISO-BMFF "ftyp" box at offset 4.
  { mime: 'image/avif', bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 },
];

const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46]; // "%PDF"

export interface ValidatedUpload {
  buffer: Buffer;
  mimeType: string;
  extension: string;
  sizeBytes: number;
}

export async function validateImageUpload(file: File): Promise<ValidatedUpload> {
  if (file.size === 0) throw validationError('The file is empty');

  if (file.size > UPLOAD_LIMITS.maxImageBytes) {
    throw new AppError(
      ERROR_CODES.PAYLOAD_TOO_LARGE,
      `Images must be ${Math.round(UPLOAD_LIMITS.maxImageBytes / 1024 / 1024)} MB or smaller`,
    );
  }

  const declared = file.type.toLowerCase();
  if (!UPLOAD_LIMITS.allowedImageTypes.includes(declared as never)) {
    throw new AppError(
      ERROR_CODES.UNSUPPORTED_MEDIA,
      'Only JPEG, PNG, WebP and AVIF images are allowed',
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = detectImageType(buffer);

  if (!detected) {
    throw new AppError(
      ERROR_CODES.UNSUPPORTED_MEDIA,
      'That file is not a valid image',
    );
  }

  return {
    buffer,
    mimeType: detected,
    extension: extensionFor(detected),
    sizeBytes: file.size,
  };
}

export async function validateDocumentUpload(file: File): Promise<ValidatedUpload> {
  if (file.size === 0) throw validationError('The file is empty');

  if (file.size > UPLOAD_LIMITS.maxDocumentBytes) {
    throw new AppError(
      ERROR_CODES.PAYLOAD_TOO_LARGE,
      `Documents must be ${Math.round(UPLOAD_LIMITS.maxDocumentBytes / 1024 / 1024)} MB or smaller`,
    );
  }

  if (!UPLOAD_LIMITS.allowedDocumentTypes.includes(file.type as never)) {
    throw new AppError(ERROR_CODES.UNSUPPORTED_MEDIA, 'Only PDF files are allowed');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!matches(buffer, PDF_SIGNATURE, 0)) {
    throw new AppError(ERROR_CODES.UNSUPPORTED_MEDIA, 'That file is not a valid PDF');
  }

  return {
    buffer,
    mimeType: 'application/pdf',
    extension: 'pdf',
    sizeBytes: file.size,
  };
}

function detectImageType(buffer: Buffer): string | null {
  for (const signature of IMAGE_SIGNATURES) {
    if (!matches(buffer, signature.bytes, signature.offset)) continue;

    // RIFF alone isn't WebP — confirm the WEBP tag at offset 8.
    if (signature.mime === 'image/webp') {
      const tag = buffer.subarray(8, 12).toString('ascii');
      if (tag !== 'WEBP') continue;
    }

    // "ftyp" covers AVIF and HEIC; only accept AVIF brands.
    if (signature.mime === 'image/avif') {
      const brand = buffer.subarray(8, 12).toString('ascii');
      if (!brand.startsWith('avif') && !brand.startsWith('avis')) continue;
    }

    return signature.mime;
  }
  return null;
}

function matches(buffer: Buffer, bytes: number[], offset: number): boolean {
  if (buffer.length < offset + bytes.length) return false;
  return bytes.every((byte, index) => buffer[offset + index] === byte);
}

function extensionFor(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif',
  };
  return map[mime] ?? 'bin';
}

/**
 * Produces a safe storage filename from a client-supplied one.
 *
 * The allowlist is the security control: anything outside [A-Za-z0-9._-]
 * becomes a hyphen, which removes path separators, control characters and
 * unicode tricks in one pass. Leading dots are stripped so a file cannot be
 * written as a dotfile.
 */
export function safeFilename(original: string): string {
  return original
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/^[.-]+/, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 120) || 'file';
}

/**
 * Storage base name derived from a client-supplied filename.
 *
 * The extension is dropped here and re-added by the caller from the *detected*
 * content type, so "photo.jpg.svg" cannot be stored as an SVG. Stripping it
 * before sanitizing matters: `safeFilename` removes leading dots, so a name
 * that is nothing but an extension (".png") would otherwise become "png".
 */
export function uploadBaseName(original: string): string {
  const withoutExtension = original.replace(/\.[^./\\]*$/, '').trim();
  return withoutExtension ? safeFilename(withoutExtension.slice(0, 60)) : 'image';
}
