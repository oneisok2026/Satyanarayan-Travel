'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { Button } from '@/components/ui/Button';
import { Input, PasswordInput, Checkbox } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Alert';
import { GoogleButton } from './GoogleButton';

const MIN_PASSWORD_LENGTH = 8;

export function RegisterForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const { signUp, configured } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    consent: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (form.name.trim().length < 2) errors.name = 'Please enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errors.email = 'Enter a valid email address.';
    if (form.password.length < MIN_PASSWORD_LENGTH)
      errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    if (form.password !== form.confirmPassword)
      errors.confirmPassword = 'Passwords do not match.';
    if (form.phone && !/^[+]?[\d\s()-]{7,20}$/.test(form.phone))
      errors.phone = 'Enter a valid phone number.';
    if (!form.consent) errors.consent = 'Please accept the terms to continue.';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await signUp({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
      });
      router.replace(redirectTo || '/account');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
      setSubmitting(false);
    }
  }

  if (!configured) {
    return (
      <Alert variant="warning" title="Registration unavailable">
        Account creation is not configured yet. Please try again later.
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <GoogleButton redirectTo={redirectTo} onError={setError} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {error && <Alert variant="error">{error}</Alert>}

        <Input
          label="Full name"
          name="name"
          autoComplete="name"
          required
          value={form.name}
          error={fieldErrors.name}
          onChange={(e) => update('name', e.target.value)}
          placeholder="Your name"
        />

        <Input
          label="Email address"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={form.email}
          error={fieldErrors.email}
          onChange={(e) => update('email', e.target.value)}
          placeholder="you@example.com"
        />

        <Input
          label="Phone number"
          type="tel"
          name="phone"
          autoComplete="tel"
          value={form.phone}
          error={fieldErrors.phone}
          onChange={(e) => update('phone', e.target.value)}
          placeholder="+91 98765 43210"
          description="Optional — helps us reach you about enquiries."
        />

        <PasswordInput
          label="Password"
          name="password"
          autoComplete="new-password"
          required
          value={form.password}
          error={fieldErrors.password}
          onChange={(e) => update('password', e.target.value)}
          description={`At least ${MIN_PASSWORD_LENGTH} characters.`}
        />

        <PasswordInput
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
          required
          value={form.confirmPassword}
          error={fieldErrors.confirmPassword}
          onChange={(e) => update('confirmPassword', e.target.value)}
        />

        <Checkbox
          name="consent"
          required
          checked={form.consent}
          error={fieldErrors.consent}
          onChange={(e) => update('consent', e.target.checked)}
          label={
            <>
              I agree to the{' '}
              <a href="/terms" className="text-brand-700 underline underline-offset-4">
                Terms
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-brand-700 underline underline-offset-4">
                Privacy Policy
              </a>
              .
            </>
          }
        />

        <Button type="submit" loading={submitting} fullWidth size="lg">
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </div>
  );
}
