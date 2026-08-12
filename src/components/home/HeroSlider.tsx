'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ButtonLink } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

/**
 * Cross-fading hero.
 *
 * Image and copy change together: each slide carries its own eyebrow,
 * headline, subheadline and buttons, so the message matches what is behind it.
 *
 * Accessibility and performance decisions worth keeping:
 *  - The first slide is `priority` (it is the LCP element); the rest are lazy,
 *    so a four-slide hero still ships one image on first paint.
 *  - Rotation loops continuously. It pauses only on keyboard focus within and
 *    while the tab is hidden; hovering deliberately does not pause, because
 *    the hero fills the viewport and a resting pointer would stall it.
 *  - Choosing a dot jumps to that slide and restarts the countdown rather
 *    than stopping the loop.
 *  - Under prefers-reduced-motion the slider never advances at all.
 *  - Only the active slide's text is in the accessibility tree and the tab
 *    order; the rest are `inert`, so a keyboard user cannot tab into a button
 *    that is invisible.
 */

export interface HeroSlide {
  id: string;
  imageUrl: string;
  imageAlt: string;
  eyebrow?: string;
  headline: string;
  headlineAccent?: string;
  subheadline?: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
}

const INTERVAL_MS = 3000;

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [stopped, setStopped] = useState(false);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion.current) setStopped(true);
  }, []);

  // A hidden tab should not keep advancing: the repaints are wasted, and the
  // visitor returns to a slide that jumped without them.
  useEffect(() => {
    function onVisibility() {
      setPaused(document.hidden);
    }
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (stopped || paused || slides.length < 2) return;

    // A timeout rather than an interval, re-armed on every index change: a
    // manual jump then gets a full window before the next advance instead of
    // inheriting whatever was left of the previous tick.
    const timer = window.setTimeout(
      () => setIndex((current) => (current + 1) % slides.length),
      INTERVAL_MS,
    );
    return () => window.clearTimeout(timer);
  }, [stopped, paused, slides.length, index]);

  // Jumping to a slide restarts the countdown rather than stopping the loop,
  // so the rotation continues from the chosen slide. `index` is a dependency
  // of the interval effect, so setting it re-arms the timer.
  const goTo = useCallback((next: number) => {
    setIndex(next);
  }, []);

  if (slides.length === 0) return null;

  return (
    <section
      className="relative isolate flex min-h-[36rem] items-center overflow-hidden lg:min-h-[42rem]"
      // Only keyboard focus pauses the rotation. Hovering does not: the hero
      // fills the viewport, so a pointer resting anywhere over it would stop
      // the slider from ever advancing.
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {slides.map((slide, slideIndex) => {
        const active = slideIndex === index;

        return (
          <div
            key={`bg-${slide.id}`}
            aria-hidden="true"
            className={cn(
              'absolute inset-0 -z-10 transition-opacity duration-[1200ms]',
              'ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
              active ? 'opacity-100' : 'opacity-0',
            )}
          >
            <Image
              src={slide.imageUrl}
              alt=""
              fill
              // Only the first slide is on screen at first paint. Marking the
              // rest lazy keeps them out of the initial load entirely.
              priority={slideIndex === 0}
              fetchPriority={slideIndex === 0 ? 'high' : 'auto'}
              loading={slideIndex === 0 ? undefined : 'lazy'}
              sizes="100vw"
              quality={75}
              className={cn('object-cover object-center', active && 'animate-hero-zoom')}
            />
          </div>
        );
      })}

      {/* Two-stage scrim: vertical for text legibility, radial for focus. */}
      <div
        aria-hidden="true"
        className="from-sand-950/70 via-sand-950/60 to-sand-950/80 absolute inset-0 -z-10 bg-gradient-to-b"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_25%,var(--color-sand-950)/45_100%)]"
      />

      <div className="container-page w-full py-24 text-center lg:py-32">
        <div className="relative mx-auto min-h-[22rem] max-w-3xl sm:min-h-[20rem]">
          {slides.map((slide, slideIndex) => {
            const active = slideIndex === index;

            return (
              <div
                key={`text-${slide.id}`}
                // Inactive copy is removed from the tab order and the
                // accessibility tree, so a keyboard user cannot reach a button
                // that is faded out.
                inert={!active}
                className={cn(
                  'flex flex-col items-center transition-all duration-700',
                  'ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                  active
                    ? 'blur-0 relative opacity-100'
                    : 'pointer-events-none absolute inset-x-0 top-0 opacity-0 blur-[2px]',
                )}
              >
                {slide.eyebrow && (
                  <p
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full bg-white/12',
                      'px-3.5 py-1.5 text-xs font-medium tracking-wide',
                      'text-sand-100 uppercase backdrop-blur-sm',
                    )}
                  >
                    <span
                      className="bg-accent-400 size-1.5 rounded-full"
                      aria-hidden="true"
                    />
                    {slide.eyebrow}
                  </p>
                )}

                <h1 className="font-display mt-5 text-4xl leading-[1.08] font-semibold text-white sm:text-5xl lg:text-6xl">
                  {slide.headline}
                  {slide.headlineAccent && (
                    <span className="text-accent-300 block">{slide.headlineAccent}</span>
                  )}
                </h1>

                {slide.subheadline && (
                  <p className="text-sand-200 mt-5 max-w-2xl text-base leading-relaxed sm:text-lg">
                    {slide.subheadline}
                  </p>
                )}

                {(slide.ctaHref || slide.secondaryCtaHref) && (
                  // Side by side at every width. The lg button's px-8 makes the
                  // pair too wide for a phone, so on mobile they share the row
                  // and shrink their padding rather than wrapping onto two
                  // lines, which pushed the slider dots off screen.
                  <div className="mt-8 flex w-full items-center justify-center gap-2.5 sm:gap-3">
                    {slide.ctaHref && slide.ctaLabel && (
                      <ButtonLink
                        href={slide.ctaHref}
                        size="lg"
                        className={cn(
                          // Text shrinks and padding tightens on a phone so
                          // both labels fit whole; the lg sizing returns from
                          // sm upwards.
                          'h-12 min-w-0 flex-1 px-3 text-[0.8125rem] leading-tight',
                          'sm:h-13 sm:flex-none sm:px-8 sm:text-base',
                        )}
                      >
                        {slide.ctaLabel}
                      </ButtonLink>
                    )}
                    {slide.secondaryCtaHref && slide.secondaryCtaLabel && (
                      <ButtonLink
                        href={slide.secondaryCtaHref}
                        size="lg"
                        variant="outline"
                        className={cn(
                          'hover:text-brand-900 border-white/70 text-white hover:bg-white',
                          'h-12 min-w-0 flex-1 px-3 text-[0.8125rem] leading-tight',
                          'sm:h-13 sm:flex-none sm:px-8 sm:text-base',
                        )}
                      >
                        {slide.secondaryCtaLabel}
                      </ButtonLink>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {slides.length > 1 && (
          <div
            role="tablist"
            aria-label="Hero slides"
            className="mt-10 flex items-center justify-center gap-2"
          >
            {slides.map((slide, slideIndex) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={slideIndex === index}
                aria-label={slide.headline}
                onClick={() => goTo(slideIndex)}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  'focus-visible:ring-4 focus-visible:ring-white/30 focus-visible:outline-none',
                  'motion-reduce:transition-none',
                  slideIndex === index
                    ? 'w-8 bg-white'
                    : 'w-3 bg-white/45 hover:bg-white/70',
                )}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
