'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/** Scroll distance before the button appears. */
const SHOW_AFTER_PX = 500;

/**
 * Scroll-to-top button, bottom-left.
 *
 * Mirrors the WhatsApp widget on the right. Unlike that one this is
 * deliberately scroll-gated: at the top of the page it has nothing to do, so
 * showing it would only occupy space.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function scrollToTop() {
    // Honour the OS setting: an instant jump for users who opt out of motion.
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });

    // Move focus back to the top of the document so keyboard and screen-reader
    // users continue from the start rather than from a detached position.
    const target = document.getElementById('main-content');
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      target.removeAttribute('tabindex');
    }
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      // Hidden from AT and the tab order until it is actually usable.
      inert={!visible}
      className={cn(
        'no-print fixed left-4 z-30 grid size-13 place-items-center rounded-2xl',
        'bg-accent-600 text-white shadow-[--shadow-float]',
        // Matches the WhatsApp widget so the two sit on the same baseline.
        'bottom-24 lg:bottom-6 lg:left-6',
        'pb-[env(safe-area-inset-bottom)]',
        'transition-[opacity,transform,background-color] duration-300',
        'ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
        'hover:bg-accent-700 hover:-translate-y-0.5 active:translate-y-0',
        'motion-reduce:transform-none',
        visible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-3 opacity-0',
      )}
    >
      <svg
        className="size-5.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
