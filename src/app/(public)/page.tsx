import type { Metadata } from 'next';
import { Hero } from '@/components/home/Hero';
import { WhyChooseUs } from '@/components/home/WhyChooseUs';
import { ServicesStrip } from '@/components/home/ServicesStrip';
import { Testimonials } from '@/components/home/Testimonials';
import { CtaBand } from '@/components/home/CtaBand';
import { Section, SectionHeading } from '@/components/ui/Section';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { ButtonLink } from '@/components/ui/Button';
import { PackageCard } from '@/components/tours/PackageCard';
import { DestinationCard } from '@/components/destinations/DestinationCard';
import { BlogCard } from '@/components/blog/BlogCard';
import { GalleryGrid } from '@/components/gallery/GalleryGrid';
import { getFeaturedDestinations } from '@/services/destination.service';
import { listPublishedPackages } from '@/services/package.service';
import {
  listPublishedServices,
  listPublishedPosts,
  listGalleryItems,
  listApprovedReviews,
} from '@/services/content.service';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

// Public catalogue content is safe to cache and revalidate periodically.
export const revalidate = 600; // home

export default async function HomePage() {
  // Loaded in parallel — these queries are independent.
  const [
    destinations,
    featured,
    domestic,
    international,
    services,
    posts,
    gallery,
    reviews,
  ] = await Promise.all([
    getFeaturedDestinations(8),
    listPublishedPackages({ featured: true, page: 1, limit: 6 }),
    listPublishedPackages({ type: 'domestic', page: 1, limit: 3 }),
    listPublishedPackages({ type: 'international', page: 1, limit: 3 }),
    listPublishedServices(),
    listPublishedPosts({ page: 1, limit: 3 }),
    listGalleryItems(undefined, 1, 8),
    listApprovedReviews(undefined, 1, 6),
  ]);

  return (
    <>
      <Hero />

      {destinations.length > 0 && (
        <Section aria-labelledby="destinations-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              id="destinations-heading"
              eyebrow="Where to go"
              title="Featured destinations"
              description="Places we know well, with itineraries to match."
              align="left"
            />
            <ButtonLink href="/destinations" variant="ghost" size="sm">
              View all destinations →
            </ButtonLink>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {destinations.slice(0, 8).map((destination, index) => (
              <ScrollReveal key={destination.id} delay={(index % 4) * 70}>
                <DestinationCard
                  destination={destination}
                  variant="tall"
                  // First row is near the fold on desktop.
                  priority={index < 2}
                />
              </ScrollReveal>
            ))}
          </div>
        </Section>
      )}

      {featured.packages.length > 0 && (
        <Section tone="muted" aria-labelledby="featured-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              id="featured-heading"
              eyebrow="Handpicked"
              title="Featured tour packages"
              description="Our most requested itineraries, costed and ready to book."
              align="left"
            />
            <ButtonLink href="/tours" variant="ghost" size="sm">
              Browse all packages →
            </ButtonLink>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.packages.map((pkg, index) => (
              <ScrollReveal key={pkg.id} delay={(index % 3) * 70}>
                <PackageCard package={pkg} />
              </ScrollReveal>
            ))}
          </div>
        </Section>
      )}

      {domestic.packages.length > 0 && (
        <Section aria-labelledby="domestic-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              id="domestic-heading"
              eyebrow="Within India"
              title="Domestic tours"
              description="From Himalayan valleys to southern backwaters and island beaches."
              align="left"
            />
            <ButtonLink href="/tours/domestic" variant="ghost" size="sm">
              All domestic tours →
            </ButtonLink>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {domestic.packages.map((pkg, index) => (
              <ScrollReveal key={pkg.id} delay={(index % 3) * 70}>
                <PackageCard package={pkg} />
              </ScrollReveal>
            ))}
          </div>
        </Section>
      )}

      {international.packages.length > 0 && (
        <Section tone="muted" aria-labelledby="international-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              id="international-heading"
              eyebrow="Beyond India"
              title="International tours"
              description="Visa guidance, airport transfers and local support included."
              align="left"
            />
            <ButtonLink href="/tours/international" variant="ghost" size="sm">
              All international tours →
            </ButtonLink>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {international.packages.map((pkg, index) => (
              <ScrollReveal key={pkg.id} delay={(index % 3) * 70}>
                <PackageCard package={pkg} />
              </ScrollReveal>
            ))}
          </div>
        </Section>
      )}

      <ServicesStrip services={services} />

      <WhyChooseUs />

      <Testimonials reviews={reviews.reviews} />

      {gallery.items.length > 0 && (
        <Section aria-labelledby="gallery-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              id="gallery-heading"
              eyebrow="Travel moments"
              title="From our journeys"
              align="left"
            />
            <ButtonLink href="/gallery" variant="ghost" size="sm">
              Open gallery →
            </ButtonLink>
          </div>

          <ScrollReveal className="mt-10">
            <GalleryGrid items={gallery.items.slice(0, 8)} />
          </ScrollReveal>
        </Section>
      )}

      {posts.posts.length > 0 && (
        <Section tone="muted" aria-labelledby="journal-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              id="journal-heading"
              eyebrow="Travel journal"
              title="Guides and planning notes"
              description="Practical advice from the trips we run."
              align="left"
            />
            <ButtonLink href="/blog" variant="ghost" size="sm">
              Read the journal →
            </ButtonLink>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.posts.map((post, index) => (
              <ScrollReveal key={post.id} delay={(index % 3) * 70}>
                <BlogCard post={post} />
              </ScrollReveal>
            ))}
          </div>
        </Section>
      )}

      <CtaBand />

      {/* Structured data: helps search engines represent the agency correctly */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'TravelAgency',
            name: 'Satyanarayan Travel',
            description:
              'Domestic and international tour packages, hotel booking, car rental and ticketing.',
            areaServed: 'IN',
          }),
        }}
      />
    </>
  );
}
