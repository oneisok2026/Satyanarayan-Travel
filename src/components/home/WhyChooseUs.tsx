import { Section, SectionHeading } from '@/components/ui/Section';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { cn } from '@/lib/utils';

const REASONS = [
  {
    title: 'Itineraries that breathe',
    body: 'We build in travel time and rest, so you are not sprinting between monuments. Fewer stops, better days.',
    icon: RouteIcon,
  },
  {
    title: 'Stays we have inspected',
    body: 'Every property on our list has been visited by someone on the team. No surprises on arrival.',
    icon: BedIcon,
  },
  {
    title: 'Honest, itemised pricing',
    body: 'Inclusions and exclusions are listed in full before you pay. No charges appear at the end of the trip.',
    icon: TagIcon,
  },
  {
    title: 'Reachable while you travel',
    body: 'A real person answers the phone during your trip, not a ticketing queue in another timezone.',
    icon: SupportIcon,
  },
  {
    title: 'Drivers who know the roads',
    body: 'Especially in the hills, this matters more than the vehicle. Our drivers work these routes year-round.',
    icon: CarIcon,
  },
  {
    title: 'Flexible on the details',
    body: 'Want an extra night, a different hotel category, or a slower pace? Every package can be adjusted.',
    icon: SlidersIcon,
  },
];

export function WhyChooseUs() {
  return (
    <Section tone="muted" aria-labelledby="why-heading">
      <SectionHeading
        id="why-heading"
        eyebrow="Why travel with us"
        title="The difference is in the planning"
        description="We are a small team that has travelled these routes ourselves. That shows up in the details."
      />

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {REASONS.map((reason, index) => (
          <ScrollReveal key={reason.title} delay={index * 60}>
            <div
              className={cn(
                'flex h-full flex-col rounded-2xl bg-sand-50 p-6',
                'ring-1 ring-accent-600/25 transition-[box-shadow,transform] duration-300',
                'ease-[cubic-bezier(0.22,1,0.36,1)]',
                'hover:-translate-y-1 hover:shadow-[--shadow-card] hover:ring-accent-600/60',
                'motion-reduce:transform-none motion-reduce:transition-none',
              )}
            >
              <span
                aria-hidden="true"
                className="grid size-11 place-items-center rounded-xl bg-brand-700 text-white"
              >
                <reason.icon />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold text-sand-900">
                {reason.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-sand-600">{reason.body}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </Section>
  );
}

const iconProps = {
  className: 'size-5',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

function RouteIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="6" cy="19" r="3" />
      <circle cx="18" cy="5" r="3" />
      <path d="M9 19h4a3 3 0 0 0 0-6h-2a3 3 0 0 1 0-6h4" />
    </svg>
  );
}

function BedIcon() {
  return (
    <svg {...iconProps}>
      <path d="M2 9V4m0 5h20m-20 0v11m20-11v11M2 14h20" />
      <circle cx="7" cy="11.5" r="1.5" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12.6 2.6a2 2 0 0 0-1.4-.6H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.2 8.2a2 2 0 0 0 2.8 0l7.2-7.2a2 2 0 0 0 0-2.8z" />
      <circle cx="7" cy="7" r="1.2" />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  );
}

function CarIcon() {
  return (
    <svg {...iconProps}>
      <path d="M5 17H3v-5l2-5h14l2 5v5h-2M5 17a2 2 0 1 0 4 0m-4 0h4m10 0a2 2 0 1 0-4 0m4 0h-4M3 12h18" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
    </svg>
  );
}
