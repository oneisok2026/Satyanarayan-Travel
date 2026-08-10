import Image from 'next/image';
import { ButtonLink } from '@/components/ui/Button';

const BACKDROP =
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1800&q=70';

/** Final conversion band before the footer. */
export function CtaBand() {
  return (
    <section className="relative isolate overflow-hidden bg-brand-900">
      <Image
        src={BACKDROP}
        alt=""
        fill
        sizes="100vw"
        loading="lazy"
        aria-hidden="true"
        className="-z-10 object-cover opacity-25"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-950/90 to-brand-900/70"
      />

      <div className="container-page py-16 lg:py-20">
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl leading-tight font-semibold text-white sm:text-4xl">
              Tell us where you want to go
            </h2>
            <p className="mt-3 text-base leading-relaxed text-sand-300">
              Share your dates, budget and how you like to travel. We will send a costed
              itinerary within one working day — no obligation, no automated quote.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink href="/contact" size="lg">
              Get a Free Quote
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
