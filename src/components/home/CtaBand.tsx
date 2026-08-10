import Image from 'next/image';
import { ButtonLink } from '@/components/ui/Button';
import { CONTACT } from '@/constants/navigation';

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
            <ButtonLink
              href={CONTACT.whatsappUrl}
              external
              size="lg"
              variant="whatsapp"
              aria-label="Chat with us on WhatsApp"
            >
              <WhatsAppIcon />
              WhatsApp Us
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhatsAppIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 6.988 2.896 9.83 9.83 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" />
    </svg>
  );
}
