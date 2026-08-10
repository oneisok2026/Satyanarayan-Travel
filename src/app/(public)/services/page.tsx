import type { Metadata } from 'next';
import { PageHero } from '@/components/layout/PageHero';
import { ServicesStrip } from '@/components/home/ServicesStrip';
import { CtaBand } from '@/components/home/CtaBand';
import { EmptyState } from '@/components/ui/EmptyState';
import { listPublishedServices } from '@/services/content.service';

export const revalidate = 3600; // services

export const metadata: Metadata = {
  title: 'Travel Services',
  description:
    'Hotel booking, chauffeur-driven car rental and flight, rail and bus ticketing — booked individually or bundled into a full itinerary.',
  alternates: { canonical: '/services' },
};

export default async function ServicesPage() {
  const services = await listPublishedServices();

  return (
    <>
      <PageHero
        eyebrow="Travel services"
        title="More than tour packages"
        description="Hotels, vehicles and ticketing — arranged individually or built into a complete trip."
        crumbs={[{ href: '/services', label: 'Services' }]}
        image={{
          url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1800&q=70',
          alt: '',
        }}
      />

      {services.length === 0 ? (
        <div className="container-page py-16">
          <EmptyState
            title="Services coming soon"
            description="Get in touch and we will help with hotels, transport and ticketing."
          />
        </div>
      ) : (
        <ServicesStrip services={services} />
      )}

      <CtaBand />
    </>
  );
}
