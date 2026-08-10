import Image from 'next/image';
import { ButtonLink } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1566837945700-30057527ade0?auto=format&fit=crop&w=2000&q=75';

const STATS = [
  { value: '16+', label: 'Years planning trips' },
  { value: '12,000+', label: 'Travellers hosted' },
  { value: '45+', label: 'Destinations covered' },
];

/**
 * Homepage hero.
 *
 * The background image is the LCP element, so it is `priority` (never lazy)
 * and `fetchPriority="high"`. Entrance animation is CSS-only with staggered
 * delays, disabled wholesale by the reduced-motion rule in globals.css.
 */
export function Hero() {
  return (
    <section className="relative isolate flex min-h-[36rem] items-center overflow-hidden lg:min-h-[42rem]">
      <Image
        src={HERO_IMAGE}
        alt="Shikara boats on Dal Lake at sunrise, Kashmir"
        fill
        priority
        fetchPriority="high"
        sizes="100vw"
        quality={75}
        className="-z-10 object-cover object-center"
      />

      {/* Two-stage scrim: vertical for text legibility, horizontal for depth */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-sand-950/70 via-sand-950/55 to-sand-950/75"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-950/60 to-transparent"
      />

      <div className="container-page py-20 lg:py-28">
        <div className="max-w-2xl">
          <p
            className={cn(
              'animate-fade-down inline-flex items-center gap-2 rounded-full',
              'bg-white/12 px-3.5 py-1.5 text-xs font-medium tracking-wide',
              'text-sand-100 uppercase backdrop-blur-sm',
            )}
            style={{ animationDelay: '0ms' }}
          >
            <span className="size-1.5 rounded-full bg-accent-400" aria-hidden="true" />
            Handcrafted journeys since 2009
          </p>

          <h1
            className="animate-fade-up mt-5 font-display text-4xl leading-[1.08] font-semibold text-white sm:text-5xl lg:text-6xl"
            style={{ animationDelay: '80ms' }}
          >
            Travel that feels
            <span className="block text-accent-300">planned for you</span>
          </h1>

          <p
            className="animate-fade-up mt-5 max-w-xl text-base leading-relaxed text-sand-200 sm:text-lg"
            style={{ animationDelay: '160ms' }}
          >
            Domestic and international tour packages built around how you actually want
            to travel — sensible routing, stays we have inspected, and a team you can
            reach while you are away.
          </p>

          <div
            className="animate-fade-up mt-8 flex flex-wrap items-center gap-3"
            style={{ animationDelay: '240ms' }}
          >
            <ButtonLink href="/tours" size="lg">
              Explore Packages
            </ButtonLink>
            <ButtonLink
              href="/contact"
              size="lg"
              variant="outline"
              className="border-white/70 text-white hover:bg-white hover:text-brand-900"
            >
              Plan a Custom Trip
            </ButtonLink>
          </div>

          <dl
            className="animate-fade-up mt-12 flex flex-wrap gap-x-10 gap-y-5"
            style={{ animationDelay: '320ms' }}
          >
            {STATS.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-display text-2xl font-semibold text-white sm:text-3xl">
                  {stat.value}
                </dd>
                <dd className="mt-0.5 text-xs text-sand-300 sm:text-sm">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
