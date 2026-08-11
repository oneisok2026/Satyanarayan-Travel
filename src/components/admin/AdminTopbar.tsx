'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

/**
 * Admin topbar.
 *
 * Spans the full width above the sidebar and page content, giving the admin
 * area a fixed frame: brand on the left, signed-in identity and sign-out on
 * the right. Sign-out lives here rather than at the foot of the sidebar so it
 * is reachable without scrolling a long nav.
 *
 * The email is presentation only. It comes from the server-verified session
 * the layout already resolved, and no route trusts it for authorization.
 */
export function AdminTopbar({ email }: { email: string }) {
  const router = useRouter();
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    await signOut();
    router.replace('/');
    // Server Components must re-render without the session cookie.
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-sand-200 bg-white pr-4 pl-16 lg:pl-0">
      {/*
        Matches the sidebar width on desktop so the brand block sits directly
        above it; below lg the sidebar is a drawer, so this collapses and the
        left padding above clears the fixed menu trigger.
      */}
      <div className="flex h-full items-center lg:w-60 lg:shrink-0 lg:border-r lg:border-sand-200 lg:bg-brand-900 lg:px-4">
        <Link
          href="/admin"
          className="font-display text-lg font-semibold text-brand-800 lg:text-white"
        >
          Admin
        </Link>
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <span className="truncate text-sm text-sand-600" title={email}>
          {email}
        </span>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={loading}
          className="shrink-0 rounded-full bg-sand-100 px-4 py-2 text-sm font-medium text-sand-800 transition-colors hover:bg-sand-200 focus-visible:ring-4 focus-visible:ring-brand-500/12 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-55"
        >
          {loading ? 'Signing out…' : 'Logout'}
        </button>
      </div>
    </header>
  );
}
