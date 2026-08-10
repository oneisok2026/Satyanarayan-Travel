'use client';

import { useEffect, useRef, type ElementType, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ScrollRevealProps {
  as?: ElementType;
  /** Stagger in ms, for revealing a row of cards in sequence. */
  delay?: number;
  className?: string;
  children: ReactNode;
}

/**
 * Reveals children once on scroll into view.
 *
 * Deliberately CSS-driven: this component only toggles a data attribute, and
 * globals.css owns the transition — which means the reduced-motion media query
 * there disables the effect without this component needing to know.
 *
 * The observer disconnects after firing, so scrolling back up does not replay
 * the animation and no observers accumulate on long pages.
 */
export function ScrollReveal({
  as: Tag = 'div',
  delay = 0,
  className,
  children,
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Respect the OS setting even before the CSS query applies.
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !('IntersectionObserver' in window)) {
      element.dataset.revealed = 'true';
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.revealed = 'true';
            observer.unobserve(entry.target);
          }
        }
      },
      // Fire slightly before the element is fully on screen.
      { threshold: 0.1, rootMargin: '0px 0px -80px 0px' },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal=""
      style={delay ? ({ '--reveal-delay': `${delay}ms` } as React.CSSProperties) : undefined}
      className={cn(className)}
    >
      {children}
    </Tag>
  );
}
