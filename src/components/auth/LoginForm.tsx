'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Alert';
import { ADMIN_ROLES } from '@/constants';
import { GoogleButton } from './GoogleButton';

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const { signIn, configured } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const user = await signIn(email, password);
      // Server has set the cookie; refresh so Server Components re-read it.
      const destination =
        redirectTo || (ADMIN_ROLES.includes(user.role) ? '/admin' : '/account');
      router.replace(destination);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.');
      setSubmitting(false);
    }
  }

  if (!configured) {
    return (
      <Alert variant="warning" title="Sign-in unavailable">
        Authentication is not configured yet. Please try again later.
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <GoogleButton redirectTo={redirectTo} onError={setError} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {error && <Alert variant="error">{error}</Alert>}

        <Input
          label="Email address"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        <div className="flex flex-col gap-1.5">
          <Input
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          <Link
            href="/forgot-password"
            className="self-end text-xs font-medium text-brand-700 underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={submitting} fullWidth size="lg">
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  );
}
