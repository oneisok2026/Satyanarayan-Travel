import 'server-only';

import { Types } from 'mongoose';
import { validationError } from '@/lib/errors';

/**
 * MongoDB query safety.
 *
 * Mongoose casts values against the schema, which blocks most injection, but
 * anything that reaches a query as a raw object (filters built from query
 * strings, `$where`-style payloads) must be sanitized first.
 */

/**
 * Strips `$`-prefixed operators and dotted paths from untrusted input.
 *
 * Without this, a JSON body of `{ "email": { "$ne": null } }` becomes an
 * operator instead of a value.
 */
export function sanitizeQueryInput<T>(input: T, depth = 0): T {
  if (depth > 6 || input == null) return input;

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeQueryInput(item, depth + 1)) as T;
  }

  if (typeof input === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if (key.startsWith('$') || key.includes('.')) continue;
      output[key] = sanitizeQueryInput(value, depth + 1);
    }
    return output as T;
  }

  return input;
}

/** Validates an ObjectId, rejecting malformed ids with a 422 not a 500. */
export function toObjectId(value: string, field = 'id'): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw validationError('Invalid identifier', { [field]: ['Not a valid id'] });
  }
  return new Types.ObjectId(value);
}

export function isValidObjectId(value: string | undefined): boolean {
  return typeof value === 'string' && Types.ObjectId.isValid(value);
}

/** Escapes user text used inside a RegExp, so `.*` cannot become a wildcard. */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Builds a bounded, anchored search regex.
 * Length-capped so a long pattern cannot cause catastrophic backtracking.
 */
export function buildSearchRegex(term: string): RegExp {
  const trimmed = term.trim().slice(0, 80);
  return new RegExp(escapeRegex(trimmed), 'i');
}
