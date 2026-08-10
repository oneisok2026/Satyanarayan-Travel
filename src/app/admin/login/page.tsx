import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/firebase/auth';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
import { Logo } from '@/components/layout/Logo';
import { ADMIN_ROLES } from '@/constants';

export const metadata: Metadata = {
  title: 'Admin sign in',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/**
 * Admin sign-in.
 *
 * This is a presentation layer over the same Firebase authentication the
 * public site uses — there is deliberately no separate admin credential
 * store. Authorization is decided afterwards from the MongoDB role, so a
 * customer signing in here gains nothing.
 */
export default async function AdminLoginPage() {
  const user = await getCurrentUser();

  if (user && ADMIN_ROLES.includes(user.role)) redirect('/admin');

  return (
    <main
      id="main-content"
      className="grid min-h-dvh place-items-center bg-brand-950 px-5 py-12"
    >
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo invert />
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-[--shadow-float] sm:p-8">
          <div className="mb-6 flex flex-col gap-1.5 text-center">
            <h1 className="font-display text-2xl font-semibold text-sand-900">
              Admin sign in
            </h1>
            <p className="text-sm text-sand-600">
              Restricted area. Staff accounts only.
            </p>
          </div>

          {/* Signed in, but without an admin role. */}
          <AdminLoginForm signedInAsNonAdmin={Boolean(user)} />
        </div>

        <p className="mt-6 text-center text-xs text-sand-400">
          <Link href="/" className="underline-offset-4 hover:underline">
            Back to website
          </Link>
        </p>
      </div>
    </main>
  );
}
