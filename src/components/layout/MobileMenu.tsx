'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { MAIN_NAV, CONTACT } from '@/constants/navigation';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  accountHref: string;
  userName?: string;
}

/**
 * Slide-in mobile navigation.
 *
 * Kept mounted and translated off-canvas so the panel animates in both
 * directions. `inert` removes it from the tab order and the accessibility
 * tree while closed, which a plain `hidden` toggle would not do smoothly.
 */
export function MobileMenu({ open, onClose, accountHref, userName }: MobileMenuProps) {
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Open the section that owns the current page, and collapse any stale one
  // once navigation lands elsewhere.
  useEffect(() => {
    const section = MAIN_NAV.find(
      (item) =>
        item.children &&
        (pathname === item.href || pathname.startsWith(`${item.href}/`)),
    );
    setExpanded(section?.href ?? null);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    // The floating WhatsApp and back-to-top buttons are fixed at z-30, below
    // this panel but still painted over the page. On mobile they land on top
    // of the panel's footer CTAs, so the open menu hides them for its
    // duration rather than each button having to know the menu exists.
    document.documentElement.dataset.menuOpen = 'true';
    document.addEventListener('keydown', onKeyDown);

    // Move focus into the panel so the next Tab lands inside it.
    const timer = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>('a,button')?.focus();
    }, 250);

    return () => {
      document.body.style.overflow = overflow;
      delete document.documentElement.dataset.menuOpen;
      document.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(timer);
    };
  }, [open, onClose]);

  return (
    <div
      // `overflow-hidden` clips the off-canvas panel: while closed it sits at
      // translate-x-full, one panel-width past the right edge, which would
      // otherwise extend the document scroll width and show a horizontal
      // scrollbar on every page.
      className={cn(
        'fixed inset-0 z-50 overflow-hidden lg:hidden',
        !open && 'pointer-events-none',
      )}
      aria-hidden={!open}
      // React 19 types `inert` as boolean; it removes the closed panel from
      // the tab order and the accessibility tree without unmounting it.
      inert={!open}
    >
      <div
        onClick={onClose}
        className={cn(
          'absolute inset-0 bg-sand-950/50 transition-opacity duration-300',
          'motion-reduce:transition-none',
          open ? 'opacity-100' : 'opacity-0',
        )}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal={open}
        aria-label="Site navigation"
        className={cn(
          'absolute inset-y-0 right-0 flex w-[min(20rem,85vw)] flex-col bg-white shadow-[var(--shadow-float)]',
          // The panel is a full-height column: the header and footer blocks
          // stay pinned while only the nav list scrolls. Without an explicit
          // min-height of 0 on the flex children a long nav pushes the footer
          // CTAs past the bottom edge, where the mobile browser chrome hides
          // them. The safe-area insets keep both ends clear of that chrome.
          'max-h-dvh min-h-0 overflow-hidden',
          'pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]',
          'transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          'motion-reduce:transition-none',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-sand-200 px-5">
          <span className="font-display font-semibold text-brand-900">Menu</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="grid size-9 place-items-center rounded-lg text-sand-600 transition-colors hover:bg-sand-100"
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
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav
          aria-label="Mobile"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4"
        >
          <ul className="flex flex-col gap-0.5">
            {MAIN_NAV.map((item) => {
              const active =
                item.href === '/'
                  ? pathname === '/'
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
              const isExpanded = expanded === item.href;

              return (
                <li key={item.href}>
                  <div className="flex items-center">
                    <Link
                      href={item.href}
                      onClick={onClose}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex-1 rounded-lg px-3 py-3 text-[0.9375rem] font-medium transition-colors',
                        active
                          ? 'bg-brand-50 text-brand-800'
                          : 'text-sand-700 hover:bg-sand-50',
                      )}
                    >
                      {item.label}
                    </Link>

                    {item.children && (
                      <button
                        type="button"
                        onClick={() => setExpanded(isExpanded ? null : item.href)}
                        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${item.label}`}
                        aria-expanded={isExpanded}
                        className="grid size-10 shrink-0 place-items-center rounded-lg text-sand-500 hover:bg-sand-50"
                      >
                        <svg
                          className={cn(
                            'size-4 transition-transform duration-200',
                            'motion-reduce:transition-none',
                            isExpanded && 'rotate-180',
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
                      </button>
                    )}
                  </div>

                  {item.children && (
                    <ul
                      className={cn(
                        'grid overflow-hidden pl-3 transition-[grid-template-rows] duration-300',
                        'ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                        isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                      )}
                    >
                      <li className="min-h-0">
                        {item.children.map((child) => {
                          const childActive = pathname === child.href;

                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={onClose}
                              aria-current={childActive ? 'page' : undefined}
                              tabIndex={isExpanded ? undefined : -1}
                              className={cn(
                                'block rounded-lg px-3 py-2.5 text-sm transition-colors',
                                childActive
                                  ? 'bg-brand-50 font-semibold text-accent-600'
                                  : 'text-sand-600 hover:bg-sand-50 hover:text-brand-800',
                              )}
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </li>
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="shrink-0 border-t border-sand-200 p-4">
          <Link
            href={accountHref}
            onClick={onClose}
            className="mb-3 block rounded-xl border border-sand-300 px-4 py-3 text-center text-sm font-medium text-sand-800 transition-colors hover:bg-sand-50"
          >
            {userName ? `My account — ${userName.split(' ')[0]}` : 'Sign in'}
          </Link>

          <Link
            href="/contact"
            onClick={onClose}
            className="block rounded-xl bg-accent-600 px-4 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-accent-700"
          >
            Plan My Trip
          </Link>

          <a
            href={CONTACT.phoneHref}
            className="mt-4 block text-center text-sm text-sand-600"
          >
            {CONTACT.phone}
          </a>
        </div>
      </div>
    </div>
  );
}
