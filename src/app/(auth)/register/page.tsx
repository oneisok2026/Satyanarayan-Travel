import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/firebase/auth';
import { ADMIN_ROLES } from '@/constants';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Create an account',
  description: 'Create an account to save packages and track your bookings.',
  robots: { index: false, follow: true },
};

export const dynamic = 'force-dynamic';

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const user = await getCurrentUser();

  if (user) {
    redirect(ADMIN_ROLES.includes(user.role) ? '/admin' : '/account');
  }

  const safeNext = next?.startsWith('/') && !next.startsWith('//') ? next : '';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5 text-center">
        <h1 className="text-2xl font-semibold text-sand-900">Create your account</h1>
        <p className="text-sm text-sand-600">
          Save packages, send enquiries and track bookings in one place.
        </p>
      </div>

      <RegisterForm redirectTo={safeNext} />

      <p className="text-center text-sm text-sand-600">
        Already have an account?{' '}
        <Link
          href={safeNext ? `/login?next=${encodeURIComponent(safeNext)}` : '/login'}
          className="font-medium text-brand-700 underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
