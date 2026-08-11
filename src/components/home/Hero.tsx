import Image from 'next/image';
import { ButtonLink } from '@/components/ui/Button';
import { AmbientBackground } from '@/components/ui/AmbientBackground';
import { HeroSlider, type HeroSlide } from './HeroSlider';
import { cn } from '@/lib/utils';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=2000&q=75';

/**
 * Homepage hero.
 *
 * Renders admin-managed slides when any are published, and falls back to this
 * built-in copy otherwise — so the homepage is never blank because nobody has
 * added a slide yet, and the site works on a fresh database.
 *
 * Either way the first image is the LCP element: `priority`, never lazy.
 * Entrance animation is CSS-only with staggered delays, disabled wholesale by
 * the reduced-motion rule in globals.css.
 */
export function Hero({ slides = [] }: { slides?: HeroSlide[] }) {
  if (slides.length > 0) {
    return <HeroSlider slides={slides} />;
  }

  return (
    <section className="relative isolate flex min-h-[36rem] items-center overflow-hidden lg:min-h-[42rem]">
      <Image
        src={HERO_IMAGE}
        alt="Palm trees along a Goa beach at golden hour"
        fill
        priority
        fetchPriority="high"
        sizes="100vw"
        quality={75}
        className="-z-10 object-cover object-center"
      />

      <div
        aria-hidden="true"
        className="from-sand-950/70 via-sand-950/60 to-sand-950/80 absolute inset-0 -z-10 bg-gradient-to-b"
      />

      <AmbientBackground className="-z-10" onDark />

      <div className="container-page w-full py-24 text-center lg:py-32">
        <div className="mx-auto max-w-3xl">
          <p
            className={cn(
              'animate-fade-down inline-flex items-center gap-2 rounded-full',
              'bg-white/12 px-3.5 py-1.5 text-xs font-medium tracking-wide',
              'text-sand-100 uppercase backdrop-blur-sm',
            )}
            style={{ animationDelay: '0ms' }}
          >
            <span className="bg-accent-400 size-1.5 rounded-full" aria-hidden="true" />
            Handcrafted journeys since 2009
          </p>

          <h1
            className="animate-fade-up font-display mt-5 text-4xl leading-[1.08] font-semibold text-white sm:text-5xl lg:text-6xl"
            style={{ animationDelay: '80ms' }}
          >
            Travel that feels
            <span className="text-accent-300 block">planned for you</span>
          </h1>

          <p
            className="animate-fade-up text-sand-200 mx-auto mt-5 max-w-2xl text-base leading-relaxed sm:text-lg"
            style={{ animationDelay: '160ms' }}
          >
            Domestic and international tour packages built around how you actually want to
            travel — sensible routing, stays we have inspected, and a team you can reach
            while you are away.
          </p>

          <div
            className="animate-fade-up mt-8 flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: '240ms' }}
          >
            <ButtonLink href="/tours" size="lg">
              Explore Packages
            </ButtonLink>
            <ButtonLink
              href="/contact"
              size="lg"
              variant="outline"
              className="hover:text-brand-900 border-white/70 text-white hover:bg-white"
            >
              Plan a Custom Trip
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
