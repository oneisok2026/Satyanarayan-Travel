import Link from 'next/link';
import { Section, SectionHeading } from '@/components/ui/Section';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { cn } from '@/lib/utils';
import type { ServiceDTO } from '@/types';

const ICONS: Record<string, () => React.JSX.Element> = {
  hotel: HotelIcon,
  car: CarIcon,
  ticket: TicketIcon,
  bus: BusIcon,
  train: TrainIcon,
  plane: PlaneIcon,
};

export function ServicesStrip({
  services,
  /** Shown on each card in place of a price. */
  priceMessage,
}: {
  services: ServiceDTO[];
  priceMessage?: string;
}) {
  if (services.length === 0) return null;

  return (
    <Section aria-labelledby="services-heading">
      <SectionHeading
        id="services-heading"
        eyebrow="Beyond tour packages"
        title="Travel services"
        description="Hotels, vehicles and ticketing — booked individually or bundled into a full itinerary."
      />

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {services.map((service, index) => {
          const Icon = ICONS[service.icon ?? ''] ?? HotelIcon;

          return (
            <ScrollReveal key={service.id} delay={index * 80}>
              <article
                className={cn(
                  'group relative flex h-full flex-col rounded-2xl bg-white p-7',
                  'shadow-[var(--shadow-card)] ring-1 ring-accent-600',
                  'transition-[box-shadow,transform] duration-300',
                  'ease-[cubic-bezier(0.22,1,0.36,1)]',
                  'hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]',
                  'motion-reduce:transform-none motion-reduce:transition-none',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'grid size-12 place-items-center rounded-xl bg-accent-50 text-accent-700',
                    'transition-colors duration-300',
                    'group-hover:bg-accent-600 group-hover:text-white',
                  )}
                >
                  <Icon />
                </span>

                <h3 className="mt-5 font-display text-xl font-semibold text-sand-900">
                  <Link
                    href={`/services/${service.slug}`}
                    className="before:absolute before:inset-0"
                  >
                    {service.name}
                  </Link>
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-sand-600">
                  {service.shortDescription}
                </p>

                {service.features.length > 0 && (
                  <ul className="mt-4 flex flex-col gap-1.5">
                    {service.features.slice(0, 3).map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-sand-600"
                      >
                        <CheckIcon />
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}

                {/* mt-auto on the wrapper so the block sits at the card's
                    foot and every card in the row aligns, whether or not the
                    message is present. */}
                <div className="mt-auto pt-5">
                  {priceMessage && (
                    <p className="mb-3 border-t border-sand-100 pt-4 font-display text-base font-semibold text-sand-900">
                      {priceMessage}
                    </p>
                  )}

                  <span className="flex items-center gap-1.5 text-sm font-medium text-accent-700">
                    Learn more
                    <svg
                      className={cn(
                        'size-4 transition-transform duration-200',
                        'group-hover:translate-x-1 motion-reduce:transform-none',
                      )}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </article>
            </ScrollReveal>
          );
        })}
      </div>
    </Section>
  );
}

function CheckIcon() {
  return (
    <svg
      className="mt-0.5 size-4 shrink-0 text-brand-600"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}

const iconProps = {
  className: 'size-6',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

function HotelIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 21V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v16M3 21h18M9 7h.01M15 7h.01M9 11h.01M15 11h.01M10 21v-4h4v4" />
    </svg>
  );
}

function CarIcon() {
  return (
    <svg {...iconProps}>
      <path d="M5 17H3v-5l2-5h14l2 5v5h-2M5 17a2 2 0 1 0 4 0m-4 0h4m10 0a2 2 0 1 0-4 0m4 0h-4" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z" />
      <path d="M13 5v2M13 11v2M13 17v2" strokeDasharray="2 3" />
    </svg>
  );
}

function BusIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 17V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v11M4 17h16M4 17v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2m10 0v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2M4 8h16M7 13h.01M17 13h.01" />
    </svg>
  );
}

function TrainIcon() {
  return (
    <svg {...iconProps}>
      <path d="M6 17V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2Z" />
      <path d="M6 10h12M9 14h.01M15 14h.01M8 19l-2 3M16 19l2 3" />
    </svg>
  );
}

function PlaneIcon() {
  return (
    <svg {...iconProps}>
      <path d="M17.8 19.2 16 11l3.5-3.5a2.12 2.12 0 0 0-3-3L13 8 4.8 6.2a1 1 0 0 0-.9 1.7l5.6 3.3-2.6 2.6-2.6-.5a.8.8 0 0 0-.7 1.3l2.2 2.2 2.2 2.2a.8.8 0 0 0 1.3-.7l-.5-2.6 2.6-2.6 3.3 5.6a1 1 0 0 0 1.7-.9Z" />
    </svg>
  );
}
