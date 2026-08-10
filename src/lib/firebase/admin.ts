import 'server-only';

import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { serverEnv } from '@/lib/env';

/**
 * Firebase Admin SDK — server only.
 *
 * The `server-only` import above makes this a build error if any client
 * component pulls it in, which is the guarantee the architecture doc asks for
 * ("Never import the Admin SDK into client components").
 *
 * Initialization is lazy and memoized: Next.js may evaluate this module in
 * several server contexts, and `getApps()` prevents duplicate-app errors on
 * Fast Refresh.
 */

let adminApp: App | null = null;

export function getAdminApp(): App {
  if (adminApp) return adminApp;

  if (getApps().length > 0) {
    adminApp = getApp();
    return adminApp;
  }

  const env = serverEnv();

  adminApp = initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY,
    }),
    projectId: env.FIREBASE_PROJECT_ID,
  });

  return adminApp;
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

/** Non-throwing probe for the health endpoint. */
export function isAdminConfigured(): boolean {
  try {
    getAdminApp();
    return true;
  } catch {
    return false;
  }
}
