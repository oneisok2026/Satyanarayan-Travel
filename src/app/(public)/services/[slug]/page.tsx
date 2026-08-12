import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/layout/PageHero';
import { Section } from '@/components/ui/Section';
import { EnquiryForm } from '@/components/enquiry/EnquiryForm';
import { getPublishedServiceBySlug } from '@/services/content.service';
import { isAppError } from '@/lib/errors';
import { clientEnv } from '@/lib/env';
import { SERVICE_SLUGS } from '@/constants';

export const revalidate = 3600; // services

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Extra enquiry fields per service, keyed by slug. */
const SERVICE_FIELDS: Record<
  string,
  { name: string; label: string; type?: string; options?: string[] }[]
> = {
  'hotel-booking': [
    { name: 'city', label: 'City or area' },
    { name: 'checkIn', label: 'Check-in date', type: 'date' },
    { name: 'checkOut', label: 'Check-out date', type: 'date' },
    { name: 'rooms', label: 'Rooms needed', type: 'number' },
    {
      name: 'hotelCategory',
      label: 'Hotel category',
      options: ['Budget', '3 star', '4 star', '5 star', 'Resort'],
    },
  ],
  'car-rental': [
    { name: 'pickupCity', label: 'Pickup city' },
    { name: 'pickupDate', label: 'Pickup date', type: 'date' },
    {
      name: 'vehicleType',
      label: 'Vehicle type',
      options: ['Hatchback', 'Sedan', 'SUV', 'Tempo Traveller', 'Mini Bus'],
    },
    { name: 'duration', label: 'Duration', options: ['Half day', 'Full day', 'Multi-day', 'Airport transfer'] },
  ],
  'e-ticket-booking': [
    { name: 'from', label: 'From' },
    { name: 'to', label: 'To' },
    { name: 'departDate', label: 'Departure date', type: 'date' },
    { name: 'returnDate', label: 'Return date', type: 'date' },
    {
      name: 'travelClass',
      label: 'Class',
      options: ['Economy', 'Premium Economy', 'Business', 'Any'],
    },
  ],
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const service = await getPublishedServiceBySlug(slug);
    return {
      title: service.seo?.title ?? service.name,
      description: service.seo?.description ?? service.shortDescription,
      ...(service.seo?.keywords?.length ? { keywords: service.seo.keywords } : {}),
      alternates: { canonical: `/services/${service.slug}` },
      openGraph: {
        title: service.name,
        description: service.shortDescription,
        url: `${clientEnv.NEXT_PUBLIC_SITE_URL}/services/${service.slug}`,
      },
    };
  } catch {
    return { title: 'Service not found', robots: { index: false } };
  }
}

/** Pre-renders the three known service pages at build time. */
export function generateStaticParams() {
  return SERVICE_SLUGS.map((slug) => ({ slug }));
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let service;
  try {
    service = await getPublishedServiceBySlug(slug);
  } catch (error) {
    if (isAppError(error) && error.code === 'NOT_FOUND') notFound();
    throw error;
  }

  const extraFields = SERVICE_FIELDS[service.slug] ?? [];

  return (
    <>
      <PageHero
        eyebrow="Travel service"
        title={service.name}
        description={service.shortDescription}
        crumbs={[
          { href: '/services', label: 'Services' },
          { href: `/services/${service.slug}`, label: service.name },
        ]}
        image={
          service.coverImage
            ? { url: service.coverImage.url, alt: '' }
            : {
                url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1800&q=70',
                alt: '',
              }
        }
      />

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="font-display text-2xl font-semibold text-sand-900">
              About this service
            </h2>
            <div className="mt-4 space-y-4 text-[0.9375rem] leading-relaxed text-sand-600">
              {service.description.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            {service.showcaseImage && (
              <figure className="mt-8">
                {/* Fixed 16:9 box so a portrait upload cannot stretch the
                    column; the image covers and crops instead. */}
                <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-sand-100 ring-1 ring-sand-200">
                  <Image
                    src={service.showcaseImage.url}
                    alt={service.showcaseImage.alt || service.name}
                    fill
                    sizes="(min-width:1024px) 55vw, 100vw"
                    className="object-cover"
                  />
                </div>
                {service.showcaseImage.caption && (
                  <figcaption className="mt-2.5 text-center text-xs text-sand-500">
                    {service.showcaseImage.caption}
                  </figcaption>
                )}
              </figure>
            )}

            {service.features.length > 0 && (
              <div className="mt-8">
                <h3 className="font-display text-lg font-semibold text-sand-900">
                  What&apos;s included
                </h3>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {service.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 rounded-xl bg-white p-3.5 text-sm text-sand-700 ring-1 ring-sand-200"
                    >
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
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl bg-white p-6 shadow-[--shadow-card] ring-1 ring-sand-200">
              <h2 className="font-display text-lg font-semibold text-sand-900">
                Request {service.name.toLowerCase()}
              </h2>
              <p className="mt-1 mb-5 text-sm text-sand-600">
                Tell us what you need and we will come back with options.
              </p>

              <EnquiryForm
                type={
                  service.slug === 'hotel-booking'
                    ? 'hotel'
                    : service.slug === 'car-rental'
                      ? 'car_rental'
                      : 'eticket'
                }
                serviceSlug={service.slug}
                extraFields={extraFields}
                compact
              />
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
