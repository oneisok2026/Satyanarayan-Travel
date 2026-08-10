'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { clientEnv, isFirebaseClientConfigured } from '@/lib/env';

/**
 * Browser-side Firebase initialization.
 *
 * Never import this from a Server Component or Route Handler — the server
 * path goes through lib/firebase/admin.ts instead.
 *
 * Initialization is lazy so that a missing Firebase config produces a clear
 * error at the point of a sign-in attempt, rather than crashing every page
 * that happens to include the auth provider.
 */

const firebaseConfig = {
  apiKey: clientEnv.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: clientEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: clientEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: clientEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: clientEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: clientEnv.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export class FirebaseNotConfiguredError extends Error {
  constructor() {
    super(
      'Firebase is not configured. Set the NEXT_PUBLIC_FIREBASE_* variables in .env.local.',
    );
    this.name = 'FirebaseNotConfiguredError';
  }
}

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseClientConfigured) throw new FirebaseNotConfiguredError();
  // getApps() guards against re-initialization across Fast Refresh.
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

export function getGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  // Always show the chooser so a shared device doesn't silently reuse an account.
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}

export const googleAuthEnabled = clientEnv.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH;
export { isFirebaseClientConfigured };
