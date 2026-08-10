import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/firebase/auth';
import { ADMIN_ROLES } from '@/constants';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to manage your bookings, enquiries and saved packages.',
  robots: { index: false, follow: true },
};

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const user = await getCurrentUser();

  // Already signed in — don't show a login form.
  if (user) {
    redirect(ADMIN_ROLES.includes(user.role) ? '/admin' : '/account');
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5 text-center">
        <h1 className="text-2xl font-semibold text-sand-900">Welcome back</h1>
        <p className="text-sm text-sand-600">
          Sign in to track your bookings and enquiries.
        </p>
      </div>

      <LoginForm redirectTo={sanitizeNext(next)} />

      <p className="text-center text-sm text-sand-600">
        New here?{' '}
        <Link
          href={next ? `/register?next=${encodeURIComponent(sanitizeNext(next))}` : '/register'}
          className="font-medium text-brand-700 underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}

/**
 * Only same-origin relative paths are accepted, so `?next=https://evil.com`
 * cannot turn the login page into an open redirect.
 */
function sanitizeNext(next: string | undefined): string {
  if (!next) return '';
  if (!next.startsWith('/') || next.startsWith('//')) return '';
  return next;
}
