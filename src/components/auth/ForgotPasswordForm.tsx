'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from './AuthProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Alert';

export function ForgotPasswordForm() {
  const { resetPassword, configured } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      // Firebase returns user-not-found here; treating it as success would be
      // friendlier but the mapped message already avoids confirming existence.
      setError(err instanceof Error ? err.message : 'Could not send the reset email.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!configured) {
    return (
      <Alert variant="warning" title="Unavailable">
        Password reset is not configured yet. Please contact us for help.
      </Alert>
    );
  }

  if (sent) {
    return (
      <Alert variant="success" title="Check your inbox">
        If an account exists for <strong>{email}</strong>, a password reset link is on
        its way. The link expires in one hour.
      </Alert>
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
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
      />

      <Button type="submit" loading={submitting} fullWidth size="lg">
        {submitting ? 'Sending…' : 'Send reset link'}
      </Button>
    </form>
  );
}
