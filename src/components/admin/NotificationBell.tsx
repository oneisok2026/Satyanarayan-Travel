'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * Admin notification bell.
 *
 * The feed is derived from records that need attention (new enquiries,
 * unconfirmed bookings, unmoderated reviews), so acting on an item removes it
 * on the next fetch without a second write.
 *
 * Opening an item uses a transition rather than a plain link: navigating to an
 * admin route means a server round trip, and `isPending` stays true for its
 * duration, so the spinner covers the actual wait instead of a fixed delay.
 */

interface AdminNotification {
  id: string;
  kind: 'enquiry' | 'booking' | 'review';
  title: string;
  detail: string;
  href: string;
  createdAt: string;
}

const POLL_MS = 60_000;

export function NotificationBell() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Which item is being navigated to, so only that row shows a spinner. */
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/notifications', {
        credentials: 'same-origin',
      });
      const body = await response.json().catch(() => null);

      if (!response.ok || !body?.success) {
        setError(body?.error?.message ?? 'Could not load notifications.');
        return;
      }

      setItems(body.data.items as AdminNotification[]);
      setTotal(body.data.total as number);
      setLoaded(true);
    } catch {
      setError('Network problem. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch the count on mount and refresh periodically, so the badge is current
  // without the admin having to open the panel.
  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  // Close once the navigation started from an item has settled, and refresh
  // the feed: the destination may be where the admin resolves that very item.
  useEffect(() => {
    if (pending || !openingId) return;
    setOpeningId(null);
    setOpen(false);
    void load();
  }, [pending, openingId, load]);

  // Close on outside click and on Escape.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function handleToggle() {
    const next = !open;
    setOpen(next);
    // Refresh on open so the list is current, not whatever the last poll saw.
    if (next) void load();
  }

  function handleOpenItem(item: AdminNotification) {
    setOpeningId(item.id);
    // The panel deliberately stays open: `router.push` inside a transition
    // keeps `isPending` true until the destination has rendered, so the
    // spinner covers the real wait. Closing here would hide it immediately.
    startTransition(() => router.push(item.href));
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={
          total > 0 ? `Notifications, ${total} needing attention` : 'Notifications'
        }
        className={cn(
          'relative grid size-10 place-items-center rounded-full',
          'text-sand-600 transition-colors hover:bg-sand-100 hover:text-sand-900',
          'focus-visible:ring-4 focus-visible:ring-brand-500/12 focus-visible:outline-none',
          open && 'bg-sand-100 text-sand-900',
        )}
      >
        <BellIcon />

        {total > 0 && (
          <span
            aria-hidden="true"
            className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[0.625rem] leading-4 font-semibold text-white"
          >
            {total > 9 ? '9+' : total}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          role="menu"
          aria-label="Notifications"
          className={cn(
            'absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))]',
            'overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-float)] ring-1 ring-sand-200',
          )}
        >
          <div className="flex items-center justify-between border-b border-sand-200 px-4 py-3">
            <p className="text-sm font-semibold text-sand-900">Notifications</p>
            {total > 0 && (
              <span className="text-xs text-sand-500">{total} outstanding</span>
            )}
          </div>

          <div className="max-h-[min(24rem,60vh)] overflow-y-auto">
            {loading && !loaded ? (
              <p className="px-4 py-6 text-center text-sm text-sand-500">Loading…</p>
            ) : error ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-sand-600">{error}</p>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="mt-2 text-sm font-medium text-brand-700 underline-offset-4 hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-sand-500">
                Nothing needs your attention.
              </p>
            ) : (
              <ul className="divide-y divide-sand-100">
                {items.map((item) => {
                  const busy = pending && openingId === item.id;

                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => handleOpenItem(item)}
                        disabled={pending}
                        className={cn(
                          'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
                          'hover:bg-sand-50 focus-visible:bg-sand-50 focus-visible:outline-none',
                          'disabled:cursor-progress',
                        )}
                      >
                        <KindDot kind={item.kind} />

                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-sand-900">
                            {item.title}
                          </span>
                          <span className="block truncate text-xs text-sand-600">
                            {item.detail}
                          </span>
                          <span className="mt-0.5 block text-[0.6875rem] text-sand-400">
                            {relativeTime(item.createdAt)}
                          </span>
                        </span>

                        {busy && <Spinner />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const KIND_COLOURS: Record<AdminNotification['kind'], string> = {
  enquiry: 'bg-sky-500',
  booking: 'bg-amber-500',
  review: 'bg-emerald-500',
};

function KindDot({ kind }: { kind: AdminNotification['kind'] }) {
  return (
    <span
      aria-hidden="true"
      className={cn('mt-1.5 size-2 shrink-0 rounded-full', KIND_COLOURS[kind])}
    />
  );
}

function Spinner() {
  return (
    <span
      role="status"
      aria-label="Opening"
      className="mt-0.5 size-4 shrink-0 animate-spin rounded-full border-2 border-sand-300 border-t-brand-700 motion-reduce:animate-none"
    />
  );
}

/** Compact relative time. Absolute dates are available on the target page. */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const minutes = Math.round((Date.now() - then) / 60_000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;

  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
