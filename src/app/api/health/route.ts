import { route } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { checkDatabaseHealth } from '@/lib/db/connect';
import { checkServerEnv } from '@/lib/env';
import { isAdminConfigured } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/health — deployment probe.
 *
 * Reports which subsystems are reachable without disclosing hostnames,
 * credentials or connection strings.
 */
export const GET = route('GET /api/health', async () => {
  const env = checkServerEnv();
  const database = await checkDatabaseHealth();
  const firebaseAdmin = isAdminConfigured();

  const healthy = env.ok && database.ok && firebaseAdmin;

  return apiSuccess(
    {
      status: healthy ? 'healthy' : 'degraded',
      checks: {
        // Only the names of missing variables, never their values.
        environment: env.ok ? 'ok' : 'misconfigured',
        database: database.ok ? 'ok' : 'unreachable',
        databaseLatencyMs: database.latencyMs,
        firebaseAdmin: firebaseAdmin ? 'ok' : 'misconfigured',
      },
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 },
  );
});
