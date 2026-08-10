import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import {
  AppError,
  ERROR_CODES,
  isAppError,
  type ErrorCode,
  type FieldErrors,
} from './errors';
import { logger } from './logger';

/**
 * The response envelope defined in system-architecture.md §15.
 * Every route handler returns one of these two shapes — no exceptions.
 */

export interface SuccessBody<T> {
  success: true;
  data: T;
  message: string;
  meta?: PaginationMeta;
}

export interface ErrorBody {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    fields?: FieldErrors;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface SuccessOptions {
  message?: string;
  status?: number;
  meta?: PaginationMeta;
  /** Cache-Control value. Only ever set this for genuinely public content. */
  cacheControl?: string;
  headers?: Record<string, string>;
}

export function apiSuccess<T>(
  data: T,
  options: SuccessOptions = {},
): NextResponse<SuccessBody<T>> {
  const {
    message = 'Success',
    status = 200,
    meta,
    cacheControl,
    headers = {},
  } = options;

  const body: SuccessBody<T> = { success: true, data, message };
  if (meta) body.meta = meta;

  const responseHeaders: Record<string, string> = { ...headers };
  // Private by default. Public endpoints must opt in explicitly.
  responseHeaders['Cache-Control'] =
    cacheControl ?? 'private, no-store, max-age=0, must-revalidate';

  return NextResponse.json(body, { status, headers: responseHeaders });
}

export function apiError(error: AppError): NextResponse<ErrorBody> {
  const body: ErrorBody = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      ...(error.fields ? { fields: error.fields } : {}),
    },
  };

  return NextResponse.json(body, {
    status: error.status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

/**
 * Converts anything thrown inside a route handler into a safe response.
 *
 * Unexpected errors are logged with full detail but returned to the client as
 * a generic message, so internal structure is never disclosed.
 */
export function handleApiError(error: unknown, route: string): NextResponse<ErrorBody> {
  const normalized = normalizeError(error);

  if (normalized.expected) {
    logger.warn(`${route} → ${normalized.code}`, {
      message: normalized.message,
      context: normalized.context,
    });
  } else {
    logger.error(`${route} → ${normalized.code}`, {
      message: normalized.message,
      context: normalized.context,
      error: normalized.cause instanceof Error ? normalized.cause : normalized,
    });
  }

  return apiError(normalized);
}

/** Maps known third-party error shapes onto the AppError taxonomy. */
export function normalizeError(error: unknown): AppError {
  if (isAppError(error)) return error;

  if (error instanceof ZodError) {
    return new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid request', {
      fields: zodToFieldErrors(error),
    });
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const fields: FieldErrors = {};
    for (const [path, issue] of Object.entries(error.errors)) {
      fields[path] = [issue.message];
    }
    return new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid request', { fields });
  }

  if (error instanceof mongoose.Error.CastError) {
    return new AppError(ERROR_CODES.VALIDATION_ERROR, 'Malformed identifier', {
      fields: { [error.path]: ['Invalid value'] },
    });
  }

  // Duplicate key — surface which field collided without echoing the value.
  if (isMongoDuplicateKeyError(error)) {
    const field = Object.keys(error.keyPattern ?? {})[0] ?? 'field';
    return new AppError(ERROR_CODES.CONFLICT, `That ${field} is already in use`, {
      fields: { [field]: ['Already in use'] },
    });
  }

  return new AppError(ERROR_CODES.INTERNAL_ERROR, 'Something went wrong', {
    cause: error,
  });
}

export function zodToFieldErrors(error: ZodError): FieldErrors {
  const fields: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_root';
    (fields[key] ??= []).push(issue.message);
  }
  return fields;
}

interface MongoDuplicateKeyError {
  code: number;
  keyPattern?: Record<string, unknown>;
}

function isMongoDuplicateKeyError(error: unknown): error is MongoDuplicateKeyError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === 11000
  );
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/** Cache-Control presets for genuinely public, non-personalized content. */
export const cachePresets = {
  publicShort: 'public, s-maxage=300, stale-while-revalidate=600',
  publicMedium: 'public, s-maxage=900, stale-while-revalidate=1800',
  publicLong: 'public, s-maxage=3600, stale-while-revalidate=7200',
  never: 'private, no-store, max-age=0, must-revalidate',
} as const;
