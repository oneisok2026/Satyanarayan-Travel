'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/constants';

interface NavLink {
  href: string;
  label: string;
  exact?: boolean;
  superAdminOnly?: boolean;
  /**
   * Marks a link that filters a listing by query string. Sibling links share
   * a pathname, so the `type` parameter is what distinguishes them and the
   * unfiltered entry is the one that matches when `type` is absent.
   */
  type?: string;
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
      { href: '/admin/packages', label: 'All packages', exact: true },
      {
        href: '/admin/packages?type=domestic',
        label: 'Domestic tours',
        type: 'domestic',
      },
      {
        href: '/admin/packages?type=international',
        label: 'International tours',
        type: 'international',
      },
      { href: '/admin/destinations', label: 'Destinations' },
      { href: '/admin/categories', label: 'Categories' },
      { href: '/admin/services', label: 'Services' },
    ],
  },
  {
    title: 'Content',
    links: [
      { href: '/admin/hero-slides', label: 'Hero slides' },
      { href: '/admin/social-links', label: 'Social links' },
      { href: '/admin/blogs', label: 'Blog' },
      { href: '/admin/gallery', label: 'Gallery' },
      { href: '/admin/pages', label: 'Pages' },
    ],
  },
  {
    title: 'System',
    links: [
      { href: '/admin/seo', label: 'SEO' },
      { href: '/admin/settings', label: 'Settings' },
    ],
  },
];

/**
 * True when a link belongs to a set of siblings that filter one listing by
 * query string, so active state must consider the parameter and not just the
 * pathname. The unfiltered entry has no `type` of its own, hence the check
 * across the group rather than on the link alone.
 */
function isFiltered(link: NavLink, group: NavLink[]): boolean {
  if (link.type !== undefined) return true;
  const path = link.href.split('?')[0];
  return group.some((other) => other.type !== undefined && other.href.startsWith(`${path}?`));
}

/**
 * Admin sidebar: fixed on desktop, a slide-in drawer below lg.
 *
 * Hiding a link is presentation only. Every admin route and API re-verifies
 * the role server-side, so a hidden link is not an access control.
 */
export function AdminNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentType = searchParams.get('type');
  const [open, setOpen] = useState(false);

  // Close the drawer whenever navigation occurs. The query string is part of
  // this: the filtered package links differ only by their `type` parameter.
  useEffect(() => setOpen(false), [pathname, currentType]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const content = (
    <div className="flex h-full flex-col p-4">
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto">
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
                  const path = link.href.split('?')[0] as string;
                  let active: boolean;

                  if (isFiltered(link, links)) {
                    // Query-filtered siblings share a pathname, so the `type`
                    // parameter decides which is current. The unfiltered entry
                    // is active only when no type is applied.
                    active = pathname === path && currentType === (link.type ?? null);
                  } else if (link.exact) {
                    active = pathname === path;
                  } else {
                    active = pathname.startsWith(path);
                  }

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
        <Link
          href="/"
          className="block rounded-lg px-3 py-2 text-sm text-sand-600 transition-colors hover:bg-sand-50 hover:text-sand-900"
        >
          View site
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile trigger, sitting inside the topbar row on the left */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open admin menu"
        aria-expanded={open}
        className="fixed top-2 left-3 z-40 grid size-10 place-items-center rounded-lg text-sand-800 transition-colors hover:bg-sand-100 lg:hidden"
      >
        <svg
          className="size-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Desktop sidebar */}
      <nav
        aria-label="Admin"
        className="hidden w-60 shrink-0 border-r border-sand-200 bg-white lg:block"
      >
        {/* Offset by the topbar height so the nav pins below it, not under it. */}
        <div className="sticky top-14 max-h-[calc(100dvh-3.5rem)] overflow-y-auto">
          {content}
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        className={cn('fixed inset-0 z-40 lg:hidden', !open && 'pointer-events-none')}
        aria-hidden={!open}
        inert={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={cn(
            'absolute inset-0 bg-sand-950/50 transition-opacity duration-300',
            'motion-reduce:transition-none',
            open ? 'opacity-100' : 'opacity-0',
          )}
        />
        <nav
          aria-label="Admin"
          className={cn(
            'absolute inset-y-0 left-0 w-[min(16rem,85vw)] bg-white shadow-[--shadow-float]',
            'transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
            'motion-reduce:transition-none',
            open ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          {content}
        </nav>
      </div>
    </>
  );
}
