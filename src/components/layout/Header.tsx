'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { MAIN_NAV, CONTACT } from '@/constants/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { MobileMenu } from './MobileMenu';
import { Logo } from './Logo';
import { ADMIN_ROLES } from '@/constants';

/**
 * Sticky site header.
 *
 * Client component because it tracks scroll state and owns the mobile menu.
 * The logo and links render immediately; only the account chip depends on
 * auth state, which arrives server-resolved so it does not flash.
 */
export function Header() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the menu whenever navigation occurs.
  useEffect(() => setMenuOpen(false), [pathname]);

  const accountHref = user
    ? ADMIN_ROLES.includes(user.role)
      ? '/admin'
      : '/account'
    : '/login';

  return (
    <>
      {/* Announcement / contact bar — hidden on small screens to save height */}
      <div className="hidden bg-brand-900 text-sand-200 lg:block">
        <div className="container-page flex h-10 items-center justify-between text-xs">
          <p>Curated journeys across India and beyond since 2009</p>
          <div className="flex items-center gap-5">
            <a href={CONTACT.phoneHref} className="hover:text-white">
              {CONTACT.phone}
            </a>
            <a href={CONTACT.emailHref} className="hover:text-white">
              {CONTACT.email}
            </a>
          </div>
        </div>
      </div>

      <header
        className={cn(
          'sticky top-0 z-40 transition-[background-color,box-shadow,backdrop-filter] duration-300',
          scrolled
            ? 'bg-white/95 shadow-[--shadow-card] backdrop-blur-md'
            : 'bg-white lg:bg-white/80 lg:backdrop-blur-sm',
        )}
      >
        {/* Taller than a single-line header: the logo stacks mark over wordmark. */}
        {/*
          The logo mark is taller than this row and overflows it deliberately —
          the source PNG carries transparent padding, so the visible artwork
          still sits inside the header.
        */}
        <div className="container-page flex h-20 items-center justify-between gap-4 lg:h-24">
          <Logo />

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-0.5">
              {MAIN_NAV.map((item) => {
                const active =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href);

                return (
                  <li key={item.href} className="group relative">
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'relative flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'text-brand-800'
                          : 'text-sand-700 hover:text-brand-800',
                      )}
                    >
                      {item.label}
                      {item.children && (
                        <svg
                          className="size-3.5 transition-transform duration-200 group-hover:rotate-180"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          aria-hidden="true"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      )}
                      {/* Underline indicator, animated from the centre */}
                      <span
                        aria-hidden="true"
                        className={cn(
                          'absolute inset-x-3 -bottom-0.5 h-0.5 origin-center rounded-full bg-accent-500',
                          'transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                          'motion-reduce:transition-none',
                          active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
                        )}
                      />
                    </Link>

                    {item.children && (
                      <div
                        className={cn(
                          'invisible absolute top-full left-0 z-50 min-w-52 pt-2 opacity-0',
                          'transition-[opacity,transform] duration-200',
                          'translate-y-1 group-hover:visible group-hover:translate-y-0',
                          'group-hover:opacity-100 group-focus-within:visible',
                          'group-focus-within:translate-y-0 group-focus-within:opacity-100',
                          'motion-reduce:transition-none',
                        )}
                      >
                        <ul className="overflow-hidden rounded-xl bg-white py-1.5 shadow-[--shadow-float] ring-1 ring-sand-200">
                          {item.children.map((child) => (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                className="block px-4 py-2.5 text-sm text-sand-700 transition-colors hover:bg-brand-50 hover:text-brand-800"
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href={accountHref}
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-sand-700 transition-colors hover:bg-sand-100 hover:text-brand-800 lg:block"
            >
              {user ? user.name.split(' ')[0] : 'Sign in'}
            </Link>

            <Link
              href="/contact"
              className={cn(
                'hidden rounded-full bg-accent-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm',
                'transition-[background-color,transform,box-shadow] duration-200',
                'hover:-translate-y-0.5 hover:bg-accent-700 hover:shadow-md',
                'motion-reduce:transform-none sm:block',
              )}
            >
              Plan My Trip
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className="grid size-10 place-items-center rounded-lg text-sand-800 transition-colors hover:bg-sand-100 lg:hidden"
            >
              <svg
                className="size-6"
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
          </div>
        </div>
      </header>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        accountHref={accountHref}
        userName={user?.name}
      />
    </>
  );
}
