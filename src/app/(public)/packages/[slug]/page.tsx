import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/layout/PageHero';
import { Section, SectionHeading } from '@/components/ui/Section';
import { Accordion } from '@/components/ui/Accordion';
import { PackageGrid } from '@/components/tours/PackageGrid';
import { PackageEnquiryPanel } from '@/components/tours/PackageEnquiryPanel';
import { StickyBookingBar } from '@/components/tours/StickyBookingBar';
import { BackToToursBar } from '@/components/tours/BackToToursBar';
import {
  getPublishedPackageBySlug,
  getRelatedPackages,
} from '@/services/package.service';
import { isAppError } from '@/lib/errors';
import { clientEnv } from '@/lib/env';
import { formatDuration, formatDate, stripHtml, truncate } from '@/lib/utils';

export const revalidate = 300; // packageDetail

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const pkg = await getPublishedPackageBySlug(slug);
    const title = pkg.seo?.title ?? pkg.title;
    const description =
      pkg.seo?.description ?? truncate(stripHtml(pkg.shortDescription), 155);

    return {
      title,
      description,
      keywords: pkg.seo?.keywords,
      alternates: { canonical: `/packages/${pkg.slug}` },
      openGraph: {
        type: 'website',
        title,
        description,
        url: `${clientEnv.NEXT_PUBLIC_SITE_URL}/packages/${pkg.slug}`,
        images: [{ url: pkg.coverImage.url, alt: pkg.coverImage.alt }],
      },
    };
  } catch {
    return { title: 'Package not found', robots: { index: false } };
  }
}

export default async function PackageDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let pkg;
  try {
    pkg = await getPublishedPackageBySlug(slug);
  } catch (error) {
    if (isAppError(error) && error.code === 'NOT_FOUND') notFound();
    throw error;
  }

  const related = await getRelatedPackages(pkg.id, 3);

  return (
    <>
      <PageHero
        eyebrow={pkg.type === 'domestic' ? 'Domestic tour' : 'International tour'}
        title={pkg.title}
        crumbs={[
          { href: '/tours', label: 'Tours' },
          { href: `/packages/${pkg.slug}`, label: pkg.title },
        ]}
        image={{ url: pkg.coverImage.url, alt: '' }}
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-sand-200">
          <span className="flex items-center gap-1.5">
            <ClockIcon />
            {formatDuration(pkg.duration.nights, pkg.duration.days)}
          </span>
          {pkg.destinations.length > 0 && (
            <span className="flex items-center gap-1.5">
              <PinIcon />
              {pkg.destinations.map((d) => d.name).join(' · ')}
            </span>
          )}
        </div>
      </PageHero>

      <BackToToursBar type={pkg.type} />

      <div className="container-page py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.7fr_1fr]">
          <div className="min-w-0">
            <section aria-labelledby="overview-heading">
              <h2
                id="overview-heading"
                className="font-display text-2xl font-semibold text-sand-900"
              >
                Overview
              </h2>
              <div className="mt-4 space-y-4 text-[0.9375rem] leading-relaxed text-sand-600">
                {pkg.description.split('\n\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </section>

            {pkg.itinerary.length > 0 && (
              <section className="mt-12" aria-labelledby="itinerary-heading">
                <h2
                  id="itinerary-heading"
                  className="font-display text-2xl font-semibold text-sand-900"
                >
                  Day-wise itinerary
                </h2>
                <p className="mt-1.5 text-sm text-sand-600">
                  {pkg.itinerary.length} days planned in detail.
                </p>

                <Accordion
                  className="mt-5"
                  defaultOpen={[String(pkg.itinerary[0]?.day ?? 1)]}
                  items={pkg.itinerary.map((day) => ({
                    id: String(day.day),
                    label: `Day ${day.day}`,
                    title: day.title,
                    content: (
                      <div className="flex flex-col gap-3">
                        <p>{day.description}</p>

                        {day.activities.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {day.activities.map((activity) => (
                              <span
                                key={activity}
                                className="rounded-full bg-brand-50 px-2.5 py-1 text-xs text-brand-800"
                              >
                                {activity}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-sand-500">
                          {day.meals.length > 0 && (
                            <span>Meals: {day.meals.join(', ')}</span>
                          )}
                          {day.accommodation && (
                            <span>Stay: {day.accommodation}</span>
                          )}
                        </div>
                      </div>
                    ),
                  }))}
                />
              </section>
            )}

            {(pkg.inclusions.length > 0 || pkg.exclusions.length > 0) && (
              <section className="mt-12" aria-labelledby="inclusions-heading">
                <h2
                  id="inclusions-heading"
                  className="font-display text-2xl font-semibold text-sand-900"
                >
                  What&apos;s included
                </h2>

                <div className="mt-5 grid gap-6 sm:grid-cols-2">
                  {pkg.inclusions.length > 0 && (
                    <div className="rounded-2xl bg-emerald-50/60 p-5 ring-1 ring-emerald-200/60">
                      <h3 className="text-sm font-semibold text-emerald-900">
                        Inclusions
                      </h3>
                      <ul className="mt-3 flex flex-col gap-2">
                        {pkg.inclusions.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2 text-sm text-sand-700"
                          >
                            <CheckIcon className="text-emerald-600" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {pkg.exclusions.length > 0 && (
                    <div className="rounded-2xl bg-red-50/50 p-5 ring-1 ring-red-200/50">
                      <h3 className="text-sm font-semibold text-red-900">
                        Not included
                      </h3>
                      <ul className="mt-3 flex flex-col gap-2">
                        {pkg.exclusions.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2 text-sm text-sand-700"
                          >
                            <CrossIcon />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}

            {pkg.hotels.length > 0 && (
              <section className="mt-12" aria-labelledby="hotels-heading">
                <h2
                  id="hotels-heading"
                  className="font-display text-2xl font-semibold text-sand-900"
                >
                  Where you&apos;ll stay
                </h2>

                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[32rem] text-left text-sm">
                    <thead>
                      <tr className="border-b border-sand-200 text-xs tracking-wide text-sand-500 uppercase">
                        <th scope="col" className="pb-3 pr-4 font-medium">City</th>
                        <th scope="col" className="pb-3 pr-4 font-medium">Hotel</th>
                        <th scope="col" className="pb-3 pr-4 font-medium">Category</th>
                        <th scope="col" className="pb-3 font-medium">Nights</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sand-100">
                      {pkg.hotels.map((hotel, index) => (
                        <tr key={`${hotel.city}-${index}`}>
                          <td className="py-3 pr-4 font-medium text-sand-900">
                            {hotel.city}
                          </td>
                          <td className="py-3 pr-4 text-sand-600">{hotel.name}</td>
                          <td className="py-3 pr-4 text-sand-600">{hotel.category}</td>
                          <td className="py-3 text-sand-600">{hotel.nights}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {pkg.transportation && (
                  <div className="mt-5 rounded-xl bg-sand-100 p-4">
                    <h3 className="text-sm font-semibold text-sand-900">
                      Transportation
                    </h3>
                    <p className="mt-1 text-sm text-sand-600">{pkg.transportation}</p>
                  </div>
                )}
              </section>
            )}

            {pkg.journeyDates.length > 0 && (
              <section className="mt-12" aria-labelledby="dates-heading">
                <h2
                  id="dates-heading"
                  className="font-display text-2xl font-semibold text-sand-900"
                >
                  Upcoming departures
                </h2>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {pkg.journeyDates.map((date, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between rounded-xl bg-white p-4 ring-1 ring-sand-200"
                    >
                      <span className="text-sm font-medium text-sand-900">
                        {formatDate(date.startDate)} – {formatDate(date.endDate)}
                      </span>
                      {date.seatsAvailable != null && (
                        <span className="text-xs text-sand-500">
                          {date.seatsAvailable} seats
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {pkg.gallery.length > 1 && (
              <section className="mt-12" aria-labelledby="package-gallery">
                <h2
                  id="package-gallery"
                  className="font-display text-2xl font-semibold text-sand-900"
                >
                  Gallery
                </h2>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {pkg.gallery.map((image, index) => (
                    <div
                      key={index}
                      className="relative aspect-[4/3] overflow-hidden rounded-xl bg-sand-200"
                    >
                      <Image
                        src={image.url}
                        alt={image.alt || `${pkg.title} photograph ${index + 1}`}
                        fill
                        sizes="(min-width:640px) 33vw, 50vw"
                        loading="lazy"
                        className="object-cover transition-transform duration-500 hover:scale-105 motion-reduce:transform-none"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>

          <PackageEnquiryPanel
            packageId={pkg.id}
            packageTitle={pkg.title}
            price={pkg.price}
            compareAtPrice={pkg.compareAtPrice}
            priceNote={pkg.priceNote}
            duration={formatDuration(pkg.duration.nights, pkg.duration.days)}
            brochureUrl={pkg.brochureUrl}
          />
        </div>
      </div>

      {related.length > 0 && (
        <Section tone="muted" aria-labelledby="related-heading">
          <SectionHeading
            id="related-heading"
            eyebrow="You may also like"
            title="Related packages"
            align="left"
          />
          <div className="mt-8">
            <PackageGrid packages={related} eagerCount={0} />
          </div>
        </Section>
      )}

      <StickyBookingBar
        packageId={pkg.id}
        packageTitle={pkg.title}
        price={pkg.price}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: pkg.title,
            description: stripHtml(pkg.shortDescription),
            image: pkg.coverImage.url,
            offers: {
              '@type': 'Offer',
              price: pkg.price,
              priceCurrency: 'INR',
              availability: 'https://schema.org/InStock',
              url: `${clientEnv.NEXT_PUBLIC_SITE_URL}/packages/${pkg.slug}`,
            },
          }),
        }}
      />
    </>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={`mt-0.5 size-4 shrink-0 ${className ?? ''}`}
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

function CrossIcon() {
  return (
    <svg
      className="mt-0.5 size-4 shrink-0 text-red-500"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      className="size-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      className="size-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
