import { FirebaseError } from 'firebase/app';

/**
 * Maps Firebase auth error codes to messages a customer can act on.
 *
 * Two deliberate choices:
 *  - Credential failures all collapse to one message, so the form cannot be
 *    used to discover which email addresses are registered.
 *  - Anything unmapped falls back to a generic message rather than exposing
 *    a raw SDK string.
 */

const MESSAGES: Record<string, string> = {
  // Sign-in — intentionally identical so they aren't an account oracle.
  'auth/invalid-credential': 'Incorrect email or password. Please try again.',
  'auth/wrong-password': 'Incorrect email or password. Please try again.',
  'auth/user-not-found': 'Incorrect email or password. Please try again.',
  'auth/invalid-email': 'Please enter a valid email address.',

  'auth/user-disabled': 'This account has been disabled. Please contact us for help.',
  'auth/too-many-requests':
    'Too many attempts. Please wait a few minutes before trying again.',

  // Registration
  'auth/email-already-in-use':
    'An account with this email already exists. Try signing in instead.',
  'auth/weak-password': 'Please choose a password of at least 8 characters.',
  'auth/operation-not-allowed':
    'This sign-in method is not enabled. Please contact support.',

  // Google / popup
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/cancelled-popup-request': 'Sign-in was cancelled.',
  'auth/popup-blocked':
    'Your browser blocked the sign-in popup. Please allow popups and try again.',
  'auth/account-exists-with-different-credential':
    'An account with this email already exists using a different sign-in method.',
  'auth/unauthorized-domain':
    'This domain is not authorised for sign-in. Please contact support.',

  // Password reset / verification
  'auth/expired-action-code': 'This link has expired. Please request a new one.',
  'auth/invalid-action-code': 'This link is invalid or has already been used.',
  'auth/missing-email': 'Please enter your email address.',

  // Re-authentication
  'auth/requires-recent-login':
    'For security, please sign in again before making this change.',

  // Network
  'auth/network-request-failed':
    'Network problem. Please check your connection and try again.',
  'auth/timeout': 'The request timed out. Please try again.',
};

const FALLBACK = 'Something went wrong. Please try again.';

export function mapAuthError(error: unknown): string {
  if (error instanceof FirebaseError) {
    return MESSAGES[error.code] ?? FALLBACK;
  }
  if (error instanceof Error && error.name === 'FirebaseNotConfiguredError') {
    return 'Sign-in is temporarily unavailable. Please try again later.';
  }
  return FALLBACK;
}

/** True when the error means the user must re-authenticate first. */
export function requiresRecentLogin(error: unknown): boolean {
  return error instanceof FirebaseError && error.code === 'auth/requires-recent-login';
}
