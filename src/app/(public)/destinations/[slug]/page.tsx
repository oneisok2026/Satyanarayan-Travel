import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/layout/PageHero';
import { PackageGrid } from '@/components/tours/PackageGrid';
import { Section, SectionHeading } from '@/components/ui/Section';
import { ButtonLink } from '@/components/ui/Button';
import { getPublishedDestinationBySlug } from '@/services/destination.service';
import { listPublishedPackages } from '@/services/package.service';
import { isAppError } from '@/lib/errors';
import { clientEnv } from '@/lib/env';

export const revalidate = 900; // destinations

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const destination = await getPublishedDestinationBySlug(slug);
    const title = destination.seo?.title ?? `${destination.name} Tour Packages`;
    const description = destination.seo?.description ?? destination.shortDescription;

    return {
      title,
      description,
      alternates: { canonical: `/destinations/${destination.slug}` },
      openGraph: {
        title,
        description,
        url: `${clientEnv.NEXT_PUBLIC_SITE_URL}/destinations/${destination.slug}`,
        images: [{ url: destination.coverImage.url, alt: destination.coverImage.alt }],
      },
    };
  } catch {
    return { title: 'Destination not found', robots: { index: false } };
  }
}

export default async function DestinationDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let destination;
  try {
    destination = await getPublishedDestinationBySlug(slug);
  } catch (error) {
    // Unpublished or missing slugs render the 404 page rather than a 500.
    if (isAppError(error) && error.code === 'NOT_FOUND') notFound();
    throw error;
  }

  const { packages } = await listPublishedPackages({
    destinationSlug: slug,
    page: 1,
    limit: 12,
  });

  return (
    <>
      <PageHero
        eyebrow={destination.type === 'domestic' ? 'India' : destination.country}
        title={destination.name}
        description={destination.shortDescription}
        crumbs={[
          { href: '/destinations', label: 'Destinations' },
          { href: `/destinations/${destination.slug}`, label: destination.name },
        ]}
        image={{ url: destination.coverImage.url, alt: '' }}
      />

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <h2 className="font-display text-2xl font-semibold text-sand-900">
              About {destination.name}
            </h2>
            <div className="mt-4 space-y-4 text-[0.9375rem] leading-relaxed text-sand-600">
              {destination.description.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>

          <aside className="flex flex-col gap-5">
            {destination.bestTimeToVisit && (
              <div className="rounded-2xl bg-brand-50 p-5 ring-1 ring-brand-100">
                <h3 className="text-sm font-semibold text-brand-900">
                  Best time to visit
                </h3>
                <p className="mt-1.5 text-sm text-brand-800">
                  {destination.bestTimeToVisit}
                </p>
              </div>
            )}

            {destination.highlights.length > 0 && (
              <div className="rounded-2xl bg-white p-5 ring-1 ring-sand-200">
                <h3 className="text-sm font-semibold text-sand-900">Highlights</h3>
                <ul className="mt-3 flex flex-col gap-2">
                  {destination.highlights.map((highlight) => (
                    <li
                      key={highlight}
                      className="flex items-start gap-2 text-sm text-sand-600"
                    >
                      <svg
                        className="mt-0.5 size-4 shrink-0 text-accent-600"
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
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-2xl bg-brand-900 p-5 text-center">
              <p className="text-sm text-sand-300">
                Want something different for {destination.name}?
              </p>
              <ButtonLink href="/contact" size="sm" fullWidth className="mt-3">
                Request a custom trip
              </ButtonLink>
            </div>
          </aside>
        </div>
      </Section>

      <Section tone="muted" aria-labelledby="destination-packages">
        <SectionHeading
          id="destination-packages"
          eyebrow="Ready to book"
          title={`${destination.name} tour packages`}
          align="left"
        />
        <div className="mt-8">
          <PackageGrid packages={packages} eagerCount={0} />
        </div>
      </Section>
    </>
  );
}
