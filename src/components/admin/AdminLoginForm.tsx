'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Input, PasswordInput } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Alert';
import { ADMIN_ROLES } from '@/constants';

/**
 * Admin sign-in form.
 *
 * Uses the same Firebase authentication as the public site. The role check
 * afterwards is a courtesy message only — the server decides access on every
 * admin page and API request regardless of what happens here.
 */
export function AdminLoginForm({
  signedInAsNonAdmin,
}: {
  signedInAsNonAdmin: boolean;
}) {
  const router = useRouter();
  const { signIn, signOut, configured } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lockedOut, setLockedOut] = useState(false);

  /**
   * Reports a failed attempt so the server can rate limit this IP.
   *
   * Firebase verifies the password, so our server never sees a wrong one —
   * without this it would have no view of guessing against this page.
   */
  async function reportFailure(): Promise<{ lockedOut: boolean; retryAfterSeconds: number }> {
    try {
      const response = await fetch('/api/auth/failed-attempt', {
        method: 'POST',
        credentials: 'same-origin',
      });
      const body = await response.json().catch(() => null);
      return {
        lockedOut: Boolean(body?.data?.lockedOut),
        retryAfterSeconds: Number(body?.data?.retryAfterSeconds ?? 0),
      };
    } catch {
      return { lockedOut: false, retryAfterSeconds: 0 };
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const user = await signIn(email, password);

      if (!ADMIN_ROLES.includes(user.role)) {
        // Signed in successfully, but this account has no admin role. Ending
        // the session avoids leaving them half-authenticated on a staff page.
        await signOut();
        await reportFailure();
        setError('That account does not have admin access.');
        setSubmitting(false);
        return;
      }

      router.replace('/admin');
      router.refresh();
    } catch (err) {
      const { lockedOut: locked, retryAfterSeconds } = await reportFailure();

      if (locked) {
        setLockedOut(true);
        const minutes = Math.ceil(retryAfterSeconds / 60);
        setError(
          `Too many failed attempts. Try again in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}.`,
        );
      } else {
        setError(
          err instanceof Error ? err.message : 'Sign-in failed. Please try again.',
        );
      }

      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.refresh();
  }

  if (!configured) {
    return (
      <Alert variant="warning" title="Sign-in unavailable">
        Authentication is not configured. Please contact your developer.
      </Alert>
    );
  }

  if (signedInAsNonAdmin) {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="warning" title="No admin access">
          You are signed in with an account that does not have admin
          permissions. Sign out and use a staff account.
        </Alert>

        <Button variant="outline" fullWidth onClick={handleSignOut}>
          Sign out
        </Button>

        <Link
          href="/account"
          className="text-center text-sm text-brand-700 underline-offset-4 hover:underline"
        >
          Go to my account
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {error && <Alert variant="error">{error}</Alert>}

      <Input
        label="Email address"
        type="email"
        name="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
      />

      <PasswordInput
        label="Password"
        name="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="••••••••"
      />

      <Button
        type="submit"
        loading={submitting}
        disabled={lockedOut}
        fullWidth
        size="lg"
      >
        {submitting ? 'Signing in…' : 'Sign in'}
      </Button>

      <Link
        href="/forgot-password"
        className="text-center text-sm text-brand-700 underline-offset-4 hover:underline"
      >
        Forgot your password?
      </Link>
    </form>
  );
}
