'use client';

import { useEffect, useState } from 'react';
import { cn, formatPrice, buildWhatsAppUrl } from '@/lib/utils';
import { CONTACT } from '@/constants/navigation';

interface StickyBookingBarProps {
  packageId: string;
  packageTitle: string;
  price: number;
}

/**
 * Mobile-only sticky CTA.
 *
 * Hidden on desktop, where the sidebar panel is always visible. Appears after
 * the user scrolls past the hero so it does not cover the opening content.
 */
export function StickyBookingBar({ packageTitle, price }: StickyBookingBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const whatsappUrl = buildWhatsAppUrl(
    CONTACT.whatsapp,
    `Hello! I'm interested in the "${packageTitle}" package.`,
  );

  return (
    <div
      className={cn(
        'no-print fixed inset-x-0 bottom-0 z-30 lg:hidden',
        'border-t border-sand-200 bg-white/97 backdrop-blur-md',
        'pb-[env(safe-area-inset-bottom)]',
        'transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
        'motion-reduce:transition-none',
        visible ? 'translate-y-0' : 'translate-y-full',
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[0.6875rem] text-sand-500">Starting from</p>
          <p className="font-display text-lg leading-tight font-semibold text-sand-900">
            {formatPrice(price)}
          </p>
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Ask about this package on WhatsApp"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-[#25D366] text-white"
        >
          <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
          </svg>
        </a>

        <a
          href="#main-content"
          onClick={(event) => {
            event.preventDefault();
            // Scroll to the enquiry panel, which is in the page flow on mobile.
            document
              .querySelector('aside')
              ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
          className="shrink-0 rounded-full bg-accent-600 px-5 py-3 text-sm font-medium text-white"
        >
          Enquire now
        </a>
      </div>
    </div>
  );
}
