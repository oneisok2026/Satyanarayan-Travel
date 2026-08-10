'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { SignOutButton } from '@/components/auth/SignOutButton';
import type { UserRole } from '@/constants';

interface NavLink {
  href: string;
  label: string;
  exact?: boolean;
  /** Omit to allow both admin and super_admin. */
  superAdminOnly?: boolean;
}

const GROUPS: { title: string; links: NavLink[] }[] = [
  {
    title: 'Overview',
    links: [{ href: '/admin', label: 'Dashboard', exact: true }],
  },
  {
    title: 'Sales',
    links: [
      { href: '/admin/enquiries', label: 'Enquiries' },
      { href: '/admin/bookings', label: 'Bookings' },
      { href: '/admin/customers', label: 'Customers' },
    ],
  },
  {
    title: 'Catalogue',
    links: [
      { href: '/admin/packages', label: 'Packages' },
      { href: '/admin/destinations', label: 'Destinations' },
      { href: '/admin/categories', label: 'Categories' },
      { href: '/admin/services', label: 'Services' },
    ],
  },
  {
    title: 'Content',
    links: [
      { href: '/admin/blogs', label: 'Blog' },
      { href: '/admin/gallery', label: 'Gallery' },
      { href: '/admin/reviews', label: 'Reviews' },
    ],
  },
  {
    title: 'System',
    links: [
      { href: '/admin/settings', label: 'Settings' },
      { href: '/admin/users', label: 'Admin users', superAdminOnly: true },
    ],
  },
];

/**
 * Hiding a link is presentation only — it is never the access control.
 * Every admin route re-verifies the role server-side.
 */
export function AdminNav({ role }: { role: UserRole }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin"
      className="hidden w-60 shrink-0 border-r border-sand-200 bg-white lg:block"
    >
      <div className="sticky top-0 flex max-h-dvh flex-col overflow-y-auto p-4">
        <Link
          href="/"
          className="mb-6 block font-display text-lg font-semibold text-brand-800"
        >
          Admin
        </Link>

        <div className="flex flex-1 flex-col gap-5">
          {GROUPS.map((group) => {
            const links = group.links.filter(
              (link) => !link.superAdminOnly || role === 'super_admin',
            );
            if (links.length === 0) return null;

            return (
              <div key={group.title}>
                <p className="mb-1.5 px-3 text-[0.6875rem] font-semibold tracking-wider text-sand-400 uppercase">
                  {group.title}
                </p>
                <ul className="flex flex-col gap-0.5">
                  {links.map((link) => {
                    const active = link.exact
                      ? pathname === link.href
                      : pathname.startsWith(link.href);

                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          aria-current={active ? 'page' : undefined}
                          className={cn(
                            'block rounded-lg px-3 py-2 text-sm transition-colors',
                            active
                              ? 'bg-brand-50 font-medium text-brand-800'
                              : 'text-sand-600 hover:bg-sand-50 hover:text-sand-900',
                          )}
                        >
                          {link.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-6 border-t border-sand-200 pt-4">
          <SignOutButton />
        </div>
      </div>
    </nav>
  );
}
