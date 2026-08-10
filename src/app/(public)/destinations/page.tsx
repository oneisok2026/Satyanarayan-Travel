import type { Metadata } from 'next';
import { PageHero } from '@/components/layout/PageHero';
import { DestinationCard } from '@/components/destinations/DestinationCard';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { EmptyState } from '@/components/ui/EmptyState';
import { listPublishedDestinations } from '@/services/destination.service';

export const revalidate = 900; // destinations

export const metadata: Metadata = {
  title: 'Destinations',
  description:
    'Explore the destinations we cover across India and abroad, with curated tour packages for each.',
  alternates: { canonical: '/destinations' },
};

export default async function DestinationsPage() {
  const { destinations } = await listPublishedDestinations({ page: 1, limit: 60 });

  const domestic = destinations.filter((d) => d.type === 'domestic');
  const international = destinations.filter((d) => d.type === 'international');

  return (
    <>
      <PageHero
        eyebrow="Where we go"
        title="Destinations"
        description="Places we know well enough to plan properly — because someone on the team has travelled them."
        crumbs={[{ href: '/destinations', label: 'Destinations' }]}
        image={{
          url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=70',
          alt: '',
        }}
      />

      <div className="container-page py-12 lg:py-16">
        {destinations.length === 0 ? (
          <EmptyState
            title="Destinations coming soon"
            description="We are adding destination guides. In the meantime, tell us where you would like to go."
          />
        ) : (
          <div className="flex flex-col gap-16">
            {domestic.length > 0 && (
              <section aria-labelledby="domestic-destinations">
                <h2
                  id="domestic-destinations"
                  className="font-display text-2xl font-semibold text-sand-900"
                >
                  Within India
                </h2>
                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {domestic.map((destination, index) => (
                    <ScrollReveal key={destination.id} delay={(index % 3) * 70}>
                      <DestinationCard
                        destination={destination}
                        priority={index < 3}
                      />
                    </ScrollReveal>
                  ))}
                </div>
              </section>
            )}

            {international.length > 0 && (
              <section aria-labelledby="international-destinations">
                <h2
                  id="international-destinations"
                  className="font-display text-2xl font-semibold text-sand-900"
                >
                  International
                </h2>
                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {international.map((destination, index) => (
                    <ScrollReveal key={destination.id} delay={(index % 3) * 70}>
                      <DestinationCard destination={destination} />
                    </ScrollReveal>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </>
  );
}
