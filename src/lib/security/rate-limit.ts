import 'server-only';

import { RATE_LIMITS, type RateLimitBucket } from '@/constants';
import { rateLimited } from '@/lib/errors';

/**
 * Fixed-window rate limiter, in-process.
 *
 * Adequate for a single Hostinger Node process. If the app is ever scaled to
 * multiple instances each keeps its own counters, so the effective limit
 * multiplies by instance count — swap the store for Redis at that point.
 * The call sites do not change.
 */

interface Counter {
  count: number;
  resetAt: number;
}

declare global {
  var __rateLimitStore: Map<string, Counter> | undefined;
}

const store = globalThis.__rateLimitStore ?? new Map<string, Counter>();
globalThis.__rateLimitStore = store;

let lastSweep = Date.now();
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

/** Drops expired counters so the map cannot grow without bound. */
function sweep(now: number): void {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, counter] of store) {
    if (counter.resetAt <= now) store.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  bucket: RateLimitBucket,
  identifier: string,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const config = RATE_LIMITS[bucket];
  const key = `${bucket}:${identifier}`;
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: config.limit - 1, resetAt };
  }

  existing.count += 1;

  return {
    allowed: existing.count <= config.limit,
    remaining: Math.max(0, config.limit - existing.count),
    resetAt: existing.resetAt,
  };
}

/** Throws AppError(RATE_LIMITED) when the bucket is exhausted. */
export function enforceRateLimit(bucket: RateLimitBucket, identifier: string): void {
  const result = checkRateLimit(bucket, identifier);
  if (!result.allowed) {
    const seconds = Math.ceil((result.resetAt - Date.now()) / 1000);
    throw rateLimited(
      `Too many requests. Please try again in ${seconds > 60 ? `${Math.ceil(seconds / 60)} minutes` : `${seconds} seconds`}.`,
    );
  }
}

/** Test/admin helper. */
export function resetRateLimit(bucket: RateLimitBucket, identifier: string): void {
  store.delete(`${bucket}:${identifier}`);
}
