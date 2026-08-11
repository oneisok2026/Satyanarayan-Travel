'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  onAuthStateChanged,
  onIdTokenChanged,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updatePassword,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirebaseAuth,
  getGoogleProvider,
  googleAuthEnabled,
  isFirebaseClientConfigured,
} from '@/lib/firebase/client';
import { mapAuthError } from '@/lib/firebase/auth-errors';
import type { SessionUser } from '@/types';

/**
 * Client auth context.
 *
 * Firebase holds the identity; the server session cookie holds the *authority*.
 * Every sign-in therefore does two things: authenticate with Firebase, then
 * POST the fresh ID token to /api/auth/session so the server can mint an
 * HTTP-only cookie. The MongoDB user returned by that endpoint is the
 * authoritative profile — the Firebase user object is never used for role.
 */

interface AuthContextValue {
  /** Raw Firebase user. Use for email-verified state and token refresh only. */
  firebaseUser: FirebaseUser | null;
  /** Authoritative application user, resolved server-side from MongoDB. */
  user: SessionUser | null;
  loading: boolean;
  configured: boolean;
  googleEnabled: boolean;

  signIn: (email: string, password: string) => Promise<SessionUser>;
  signUp: (input: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<SessionUser>;
  signInWithGoogle: () => Promise<SessionUser>;
  signOut: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  /** Changes the signed-in user's password, proving the current one first. */
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  /** Re-reads the MongoDB user, e.g. after a profile update. */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: ReactNode;
  /** Server-resolved user, so the first paint isn't a loading flash. */
  initialUser?: SessionUser | null;
}) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<SessionUser | null>(initialUser);
  const [loading, setLoading] = useState(isFirebaseClientConfigured);

  // Guards against a stale in-flight sync overwriting a newer one.
  const syncSequence = useRef(0);

  /** Exchange the current Firebase ID token for a server session cookie. */
  const establishSession = useCallback(
    async (fbUser: FirebaseUser): Promise<SessionUser> => {
      const idToken = await fbUser.getIdToken(/* forceRefresh */ true);

      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ idToken }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok || !body?.success) {
        // Don't leave a half-authenticated client holding a Firebase session
        // the server has refused.
        await firebaseSignOut(getFirebaseAuth()).catch(() => undefined);
        throw new Error(
          body?.error?.message ?? 'Could not start your session. Please try again.',
        );
      }

      return body.data.user as SessionUser;
    },
    [],
  );

  const clearSession = useCallback(async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin',
    }).catch(() => undefined);
  }, []);

  // Track Firebase auth state. Fires on load, sign-in, sign-out.
  useEffect(() => {
    if (!isFirebaseClientConfigured) {
      setLoading(false);
      return;
    }

    const auth = getFirebaseAuth();

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      const sequence = ++syncSequence.current;
      setFirebaseUser(fbUser);

      if (!fbUser) {
        if (sequence === syncSequence.current) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      // A Firebase session exists but we have no application user yet
      // (returning visitor, fresh tab). Re-establish the server session.
      try {
        const appUser = await establishSession(fbUser);
        if (sequence === syncSequence.current) setUser(appUser);
      } catch {
        if (sequence === syncSequence.current) setUser(null);
      } finally {
        if (sequence === syncSequence.current) setLoading(false);
      }
    });

    return unsubscribe;
  }, [establishSession]);

  // Firebase refreshes ID tokens roughly hourly; the session cookie outlives
  // that, but refreshing on rotation keeps custom-claim changes (e.g. a role
  // grant) from taking an hour to appear.
  useEffect(() => {
    if (!isFirebaseClientConfigured) return;
    const auth = getFirebaseAuth();
    let first = true;

    return onIdTokenChanged(auth, async (fbUser) => {
      if (first) {
        first = false;
        return;
      }
      if (!fbUser) return;
      try {
        const appUser = await establishSession(fbUser);
        setUser(appUser);
      } catch {
        /* keep the existing session; onAuthStateChanged handles hard failures */
      }
    });
  }, [establishSession]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const auth = getFirebaseAuth();
        const credential = await signInWithEmailAndPassword(
          auth,
          email.trim().toLowerCase(),
          password,
        );
        const appUser = await establishSession(credential.user);
        setUser(appUser);
        return appUser;
      } catch (error) {
        throw new Error(mapAuthError(error));
      }
    },
    [establishSession],
  );

  const signUp = useCallback<AuthContextValue['signUp']>(
    async ({ name, email, password, phone }) => {
      try {
        const auth = getFirebaseAuth();
        const credential = await createUserWithEmailAndPassword(
          auth,
          email.trim().toLowerCase(),
          password,
        );

        // Set the display name before session sync so the MongoDB record is
        // created with the right name on first write.
        await updateProfile(credential.user, { displayName: name.trim() });
        await sendEmailVerification(credential.user).catch(() => undefined);

        const appUser = await establishSession(credential.user);

        // Phone lives only in MongoDB — Firebase has no field for it here.
        if (phone?.trim()) {
          await fetch('/api/users/me', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ phone: phone.trim() }),
          }).catch(() => undefined);
        }

        setUser(appUser);
        return appUser;
      } catch (error) {
        if (error instanceof Error && !('code' in error)) throw error;
        throw new Error(mapAuthError(error));
      }
    },
    [establishSession],
  );

  const signInWithGoogle = useCallback(async () => {
    try {
      const auth = getFirebaseAuth();
      const credential = await signInWithPopup(auth, getGoogleProvider());
      const appUser = await establishSession(credential.user);
      setUser(appUser);
      return appUser;
    } catch (error) {
      throw new Error(mapAuthError(error));
    }
  }, [establishSession]);

  const signOut = useCallback(async () => {
    syncSequence.current++;
    // Clear the server cookie first: if the tab dies midway, the authoritative
    // session is already gone rather than lingering after a local sign-out.
    await clearSession();
    if (isFirebaseClientConfigured) {
      await firebaseSignOut(getFirebaseAuth()).catch(() => undefined);
    }
    setUser(null);
    setFirebaseUser(null);
  }, [clearSession]);

  const sendVerificationEmail = useCallback(async () => {
    const current = getFirebaseAuth().currentUser;
    if (!current) throw new Error('You need to be signed in to do that.');
    try {
      await sendEmailVerification(current);
    } catch (error) {
      throw new Error(mapAuthError(error));
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email.trim().toLowerCase());
    } catch (error) {
      throw new Error(mapAuthError(error));
    }
  }, []);

  /**
   * Changes the password of the signed-in user.
   *
   * Reauthenticates with the current password first. Firebase requires a
   * recent login for this operation anyway, but doing it explicitly means the
   * current password is *proved* rather than assumed — someone who walks up to
   * an unlocked, already-signed-in browser cannot take over the account.
   *
   * The application never stores or transmits the credential itself: both
   * calls go straight to Firebase from the browser.
   */
  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      const current = getFirebaseAuth().currentUser;
      if (!current?.email) {
        throw new Error('You need to be signed in to do that.');
      }

      try {
        await reauthenticateWithCredential(
          current,
          EmailAuthProvider.credential(current.email, currentPassword),
        );
        await updatePassword(current, newPassword);

        // A password change invalidates the existing session cookie's basis,
        // so exchange a fresh ID token for a new cookie. Without this the
        // admin stays signed in client-side while server requests start
        // failing on the stale session.
        await establishSession(current);
      } catch (error) {
        throw new Error(mapAuthError(error));
      }
    },
    [establishSession],
  );

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch('/api/users/me', { credentials: 'same-origin' });
      const body = await response.json().catch(() => null);
      if (response.ok && body?.success) setUser(body.data.user as SessionUser);
    } catch {
      /* non-fatal — keep showing the last known user */
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      firebaseUser,
      user,
      loading,
      configured: isFirebaseClientConfigured,
      googleEnabled: googleAuthEnabled && isFirebaseClientConfigured,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      sendVerificationEmail,
      resetPassword,
      changePassword,
      refreshUser,
    }),
    [
      firebaseUser,
      user,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      sendVerificationEmail,
      resetPassword,
      changePassword,
      refreshUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an <AuthProvider>.');
  }
  return context;
}
