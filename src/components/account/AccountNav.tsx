'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { SignOutButton } from '@/components/auth/SignOutButton';

interface AccountLink {
  href: string;
  label: string;
  /** Match the path exactly, so "Overview" isn't active on every subpage. */
  exact?: boolean;
}

const LINKS: AccountLink[] = [
  { href: '/account', label: 'Overview', exact: true },
  { href: '/account/bookings', label: 'Bookings' },
  { href: '/account/enquiries', label: 'Enquiries' },
  { href: '/account/favourites', label: 'Favourites' },
  { href: '/account/downloads', label: 'Downloads' },
  { href: '/account/profile', label: 'Profile' },
];

export function AccountNav({
  userName,
  emailVerified,
}: {
  userName: string;
  emailVerified: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Account" className="lg:sticky lg:top-24 lg:self-start">
      <div className="mb-4 rounded-xl bg-white p-4 ring-1 ring-sand-200/70">
        <p className="text-xs text-sand-500">Signed in as</p>
        <p className="truncate font-medium text-sand-900">{userName}</p>
        {!emailVerified && (
          <p className="mt-1.5 text-xs text-amber-700">Email not verified</p>
        )}
      </div>

      <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {LINKS.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);

          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'block rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-brand-700 text-white'
                    : 'text-sand-700 hover:bg-white hover:text-sand-900',
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 hidden lg:block">
        <SignOutButton />
      </div>
    </nav>
  );
}
