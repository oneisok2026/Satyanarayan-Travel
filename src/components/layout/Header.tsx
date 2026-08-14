'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { MAIN_NAV } from '@/constants/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { MobileMenu } from './MobileMenu';
import { Logo } from './Logo';
import { SocialIcons, type SocialLinkItem } from './SocialIcons';
import { ADMIN_ROLES } from '@/constants';
import type { ContactDetailDTO } from '@/types';

/**
 * Sticky site header.
 *
 * Client component because it tracks scroll state and owns the mobile menu.
 * The logo and links render immediately; only the account chip depends on
 * auth state, which arrives server-resolved so it does not flash.
 */
export function Header({
  socialLinks = [],
  emails = [],
  phones = [],
}: {
  socialLinks?: SocialLinkItem[];
  /** Addresses to show in the top bar, already filtered to this placement. */
  emails?: ContactDetailDTO[];
  phones?: ContactDetailDTO[];
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  /** href of the nav item whose dropdown is open, or null. */
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the menu whenever navigation occurs.
  useEffect(() => {
    setMenuOpen(false);
    setOpenMenu(null);
  }, [pathname]);

  // A dropdown left open would sit over the page after a same-route click, so
  // it also closes on outside pointer, Escape, and focus leaving the nav.
  useEffect(() => {
    if (!openMenu) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenMenu(null);
    };
    const onFocusIn = (event: FocusEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [openMenu]);

  /** True when `href` is the current page (exact match, not prefix). */
  const isCurrent = useCallback(
    (href: string) => pathname === href,
    [pathname],
  );

  const accountHref = user
    ? ADMIN_ROLES.includes(user.role)
      ? '/admin'
      : '/account'
    : '/login';

  return (
    <>
      {/* Contact bar — hidden on small screens to save height */}
      {(emails.length > 0 || phones.length > 0 || socialLinks.length > 0) && (
        <div className="hidden bg-brand-900 text-sand-200 lg:block">
          {/* Row height grows with the text so the bar keeps its proportions. */}
          <div className="container-page flex h-11 items-center justify-between gap-6 text-sm">
            {/*
              min-w-0 and a scroll container: the agency can publish several
              numbers here, and past a few the row would otherwise push the
              social icons off the right edge of the bar.
            */}
            <div className="flex min-w-0 items-center gap-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {emails.map((email) => (
                <a
                  key={email.id}
                  href={email.href}
                  title={email.label}
                  className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap transition-colors hover:text-accent-500"
                >
                  <MailIcon />
                  {email.value}
                </a>
              ))}

              {phones.map((phone) => (
                <a
                  key={phone.id}
                  href={phone.href}
                  title={phone.label}
                  className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap transition-colors hover:text-accent-500"
                >
                  <PhoneIcon />
                  {phone.value}
                </a>
              ))}
            </div>

            <SocialIcons links={socialLinks} />
          </div>
        </div>
      )}

      <header
        className={cn(
          'sticky top-0 z-40 transition-[background-color,box-shadow,backdrop-filter] duration-300',
          scrolled
            ? 'bg-white/95 shadow-[var(--shadow-card)] backdrop-blur-md'
            : 'bg-white lg:bg-white/80 lg:backdrop-blur-sm',
        )}
      >
        {/* Taller than a single-line header: the logo stacks mark over wordmark. */}
        <div className="container-page flex h-20 items-center justify-between gap-4 lg:h-24">
          <Logo />

          <nav aria-label="Main" ref={navRef} className="hidden lg:block">
            <ul className="flex items-center gap-0.5">
              {MAIN_NAV.map((item) => {
                // A section counts as active for its whole subtree, so
                // /tours/domestic still lights up "Tours".
                const active =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);
                const open = openMenu === item.href;

                return (
                  <li
                    key={item.href}
                    className="relative"
                    onMouseEnter={
                      item.children ? () => setOpenMenu(item.href) : undefined
                    }
                    onMouseLeave={
                      item.children ? () => setOpenMenu(null) : undefined
                    }
                  >
                    <Link
                      href={item.href}
                      aria-current={isCurrent(item.href) ? 'page' : undefined}
                      aria-expanded={item.children ? open : undefined}
                      onClick={() => setOpenMenu(null)}
                      className={cn(
                        'group relative flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'text-brand-800'
                          : 'text-sand-700 hover:text-brand-800',
                      )}
                    >
                      {item.label}
                      {item.children && (
                        <svg
                          className={cn(
                            'size-3.5 transition-transform duration-200',
                            open && 'rotate-180',
                          )}
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
                          active
                            ? 'scale-x-100'
                            : 'scale-x-0 group-hover:scale-x-100',
                        )}
                      />
                    </Link>

                    {item.children && (
                      <div
                        className={cn(
                          'absolute top-full left-0 z-50 min-w-52 pt-2',
                          'transition-[opacity,transform] duration-200',
                          'motion-reduce:transition-none',
                          open
                            ? 'visible translate-y-0 opacity-100'
                            : 'invisible translate-y-1 opacity-0',
                        )}
                      >
                        <ul className="overflow-hidden rounded-xl bg-white py-1.5 shadow-[var(--shadow-float)] ring-1 ring-sand-200">
                          {item.children.map((child) => {
                            const childActive = isCurrent(child.href);

                            return (
                              <li key={child.href}>
                                <Link
                                  href={child.href}
                                  aria-current={childActive ? 'page' : undefined}
                                  tabIndex={open ? undefined : -1}
                                  onClick={() => setOpenMenu(null)}
                                  className={cn(
                                    'block px-4 py-2.5 text-sm transition-colors',
                                    childActive
                                      ? 'bg-brand-50 font-semibold text-accent-600'
                                      : 'text-sand-700 hover:bg-brand-50 hover:text-brand-800',
                                  )}
                                >
                                  {child.label}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            {/* Shown only once signed in: the account link is how a customer
                reaches their bookings, but the signed-out "Sign in" prompt is
                deliberately absent from the bar. */}
            {user && (
              <Link
                href={accountHref}
                className="hidden rounded-full px-4 py-2 text-sm font-medium text-sand-700 transition-colors hover:bg-sand-100 hover:text-brand-800 lg:block"
              >
                {user.name.split(' ')[0]}
              </Link>
            )}

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
        phones={phones}
      />
    </>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
      aria-hidden="true"
    >
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
      aria-hidden="true"
    >
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
    </svg>
  );
}
