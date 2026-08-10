import type { Metadata } from 'next';
import Image from 'next/image';
import { PageHero } from '@/components/layout/PageHero';
import { Section, SectionHeading } from '@/components/ui/Section';
import { WhyChooseUs } from '@/components/home/WhyChooseUs';
import { CtaBand } from '@/components/home/CtaBand';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

export const revalidate = 86400; // staticPage

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'A travel agency run by people who have made these journeys themselves — planning domestic and international trips since 2009.',
  alternates: { canonical: '/about' },
};

const VALUES = [
  {
    title: 'We travel the routes we sell',
    body: 'Every itinerary we publish has been walked by someone on the team. That is how we know which hotel has the view, which road is worth the extra hour, and which "must-see" you can safely skip.',
  },
  {
    title: 'Pricing you can check',
    body: 'Inclusions and exclusions are listed in full before you pay anything. If something is not in the package, it is written down — not discovered at the destination.',
  },
  {
    title: 'Small enough to care',
    body: 'You deal with the same consultant from first enquiry to your return home. No ticket numbers, no handovers, no repeating yourself.',
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title="Journeys planned by people who have made them"
        description="We have been arranging travel across India and abroad since 2009 — for families, couples, pilgrims and groups."
        crumbs={[{ href: '/about', label: 'About' }]}
        image={{
          url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1800&q=70',
          alt: '',
        }}
      />

      <Section>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Our story"
              title="Built on trips we took ourselves"
              align="left"
            />
            <div className="mt-5 space-y-4 text-[0.9375rem] leading-relaxed text-sand-600">
              <p>
                Satyanarayan Travel started with a simple frustration: package holidays
                that looked good on paper and fell apart on the road. Hotels that were
                nothing like their photographs. Itineraries that spent more hours in a
                vehicle than at the places they promised.
              </p>
              <p>
                We began by planning trips for friends and family, visiting the routes
                ourselves before recommending them. That has not changed. Every hotel on
                our list has been inspected. Every drive time in our itineraries is one
                we have actually done, not one copied from a map.
              </p>
              <p>
                Sixteen years later we have arranged travel for more than twelve
                thousand people across forty-five destinations — but we still work the
                same way, and you still get a person rather than a portal.
              </p>
            </div>
          </div>

          <ScrollReveal>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-sand-200">
              <Image
                src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=70"
                alt="A winding mountain road through a valley"
                fill
                sizes="(min-width:1024px) 50vw, 100vw"
                loading="lazy"
                className="object-cover"
              />
            </div>
          </ScrollReveal>
        </div>
      </Section>

      <Section tone="muted" aria-labelledby="values-heading">
        <SectionHeading
          id="values-heading"
          eyebrow="How we work"
          title="Three things we do not compromise on"
        />

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {VALUES.map((value, index) => (
            <ScrollReveal key={value.title} delay={index * 80}>
              <div className="flex h-full flex-col rounded-2xl bg-white p-6 ring-1 ring-sand-200">
                <span
                  aria-hidden="true"
                  className="font-display text-3xl font-semibold text-accent-500"
                >
                  0{index + 1}
                </span>
                <h3 className="mt-3 font-display text-lg font-semibold text-sand-900">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-sand-600">
                  {value.body}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </Section>

      <WhyChooseUs />

      <CtaBand />
    </>
  );
}
