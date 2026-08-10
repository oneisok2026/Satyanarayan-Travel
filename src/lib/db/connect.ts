import 'server-only';

import mongoose, { type Mongoose } from 'mongoose';
import { serverEnv } from '@/lib/env';
import { logger } from '@/lib/logger';
import { serviceUnavailable } from '@/lib/errors';

/**
 * Mongoose connection with cross-invocation reuse.
 *
 * Next.js re-evaluates modules on Fast Refresh in dev, and serverless-style
 * invocations may reuse a warm process. Caching the *promise* on globalThis
 * means concurrent first requests await one connection attempt instead of
 * each opening their own pool.
 */

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

declare global {
  var __mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = globalThis.__mongooseCache ?? {
  conn: null,
  promise: null,
};

globalThis.__mongooseCache = cache;

// Reject writes with fields not in the schema, rather than silently dropping.
mongoose.set('strictQuery', true);

export async function connectToDatabase(): Promise<Mongoose> {
  if (cache.conn && cache.conn.connection.readyState === 1) {
    return cache.conn;
  }

  if (!cache.promise) {
    const env = serverEnv();

    cache.promise = mongoose
      .connect(env.MONGODB_URI, {
        dbName: env.MONGODB_DB_NAME,
        // Fail fast instead of hanging a request for 30s on a bad network.
        serverSelectionTimeoutMS: 10_000,
        socketTimeoutMS: 45_000,
        maxPoolSize: 10,
        minPoolSize: 1,
        retryWrites: true,
        // Reads/writes must land before the app considers them done.
        writeConcern: { w: 'majority' },
      })
      .then((instance) => {
        logger.info('MongoDB connected', { database: env.MONGODB_DB_NAME });
        return instance;
      })
      .catch((error) => {
        // Clear the cached promise so the next request retries instead of
        // permanently resolving to a rejected promise.
        cache.promise = null;
        logger.error('MongoDB connection failed', {
          error: error instanceof Error ? error : String(error),
        });
        throw serviceUnavailable(
          'Could not reach the database. Please try again in a moment.',
        );
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

/** Health probe: reports reachability without throwing. */
export async function checkDatabaseHealth(): Promise<{
  ok: boolean;
  latencyMs?: number;
  error?: string;
}> {
  const startedAt = Date.now();
  try {
    const instance = await connectToDatabase();
    await instance.connection.db?.admin().ping();
    return { ok: true, latencyMs: Date.now() - startedAt };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

/** Used by scripts and tests to shut the pool down cleanly. */
export async function disconnectFromDatabase(): Promise<void> {
  if (cache.conn) {
    await mongoose.disconnect();
    cache.conn = null;
    cache.promise = null;
  }
}
