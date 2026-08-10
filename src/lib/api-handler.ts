import 'server-only';

import type { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from './api-response';
import { validationError } from './errors';

/**
 * Route handler wrapper.
 *
 * Guarantees every route returns the standard envelope and that no thrown
 * error escapes as an unformatted Next.js 500 leaking a stack trace.
 */

type Handler<TContext> = (
  request: NextRequest,
  context: TContext,
) => Promise<NextResponse>;

export function route<TContext = unknown>(
  name: string,
  handler: Handler<TContext>,
): Handler<TContext> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleApiError(error, name);
    }
  };
}

/** Parses a JSON body, rejecting malformed input with a 422 rather than a 500. */
export async function readJsonBody(request: NextRequest): Promise<unknown> {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw validationError('Expected a JSON request body');
  }

  try {
    return await request.json();
  } catch {
    throw validationError('Request body is not valid JSON');
  }
}

/**
 * Best-effort client IP for rate limiting.
 *
 * Only the leftmost x-forwarded-for entry is used, and it is trusted solely
 * because Hostinger's proxy sets it. It is a rate-limit key, never an
 * authorization input.
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}
