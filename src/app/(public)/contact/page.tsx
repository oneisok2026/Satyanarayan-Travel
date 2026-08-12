import type { Metadata } from 'next';
import { buildPageMetadata } from '@/services/page-seo.service';
import { PageHero } from '@/components/layout/PageHero';
import { Section } from '@/components/ui/Section';
import { EnquiryForm } from '@/components/enquiry/EnquiryForm';
import { ButtonLink } from '@/components/ui/Button';
import { CONTACT } from '@/constants/navigation';
import { clientEnv } from '@/lib/env';

export function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('/contact');
}

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Get in touch"
        title="Tell us where you want to go"
        description="Share your dates, budget and how you like to travel. We will send a costed itinerary — no obligation."
        crumbs={[{ href: '/contact', label: 'Contact' }]}
        image={{
          url: 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1800&q=70',
          alt: '',
        }}
      />

      <Section>
        {/* min-w-0 on both columns: a grid track defaults to min-width:auto and
            would otherwise refuse to shrink below its content's min-content
            width, pushing the page wider than the viewport on small screens. */}
        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
          <div className="flex min-w-0 flex-col gap-5">
            <div className="rounded-2xl bg-white p-6 ring-1 ring-sand-200">
              <h2 className="font-display text-lg font-semibold text-sand-900">
                Speak to us directly
              </h2>
              <p className="mt-1.5 text-sm text-sand-600">
                Office hours: Monday to Saturday, 10am to 7pm IST.
              </p>

              <div className="mt-5 flex flex-col gap-3">
                {CONTACT.phones.map((phone, index) => (
                  <a
                    key={phone.number}
                    href={phone.href}
                    className="flex items-center gap-3 rounded-xl bg-sand-50 p-3.5 transition-colors hover:bg-sand-100"
                  >
                    <span
                      aria-hidden="true"
                      className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-600 text-white"
                    >
                      <PhoneIcon />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs text-sand-500">
                        {index === 0 ? 'Call us' : 'Alternate line'}
                      </span>
                      <span className="block truncate font-medium text-sand-900">
                        {phone.number}
                      </span>
                    </span>
                  </a>
                ))}

                <a
                  href={CONTACT.emailHref}
                  className="flex items-center gap-3 rounded-xl bg-sand-50 p-3.5 transition-colors hover:bg-sand-100"
                >
                  <span
                    aria-hidden="true"
                    className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-700 text-white"
                  >
                    <MailIcon />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs text-sand-500">Email us</span>
                    <span className="block truncate font-medium text-sand-900">
                      {CONTACT.email}
                    </span>
                  </span>
                </a>
              </div>

              <ButtonLink
                href={CONTACT.whatsappUrl}
                external
                variant="whatsapp"
                fullWidth
                className="mt-4"
              >
                Chat on WhatsApp
              </ButtonLink>
            </div>

            <div className="rounded-2xl bg-brand-50 p-6 ring-1 ring-brand-100">
              <h2 className="font-display text-lg font-semibold text-brand-900">
                What happens next
              </h2>
              <ol className="mt-4 flex flex-col gap-3.5">
                {[
                  'We read your enquiry and check availability for your dates.',
                  'A travel consultant calls to understand what you want from the trip.',
                  'You receive a costed itinerary, usually within one working day.',
                  'We adjust it until it fits, then confirm the booking.',
                ].map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm text-brand-900">
                    <span
                      aria-hidden="true"
                      className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-700 text-xs font-semibold text-white"
                    >
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="min-w-0 rounded-2xl bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-sand-200 sm:p-8">
            <h2 className="font-display text-xl font-semibold text-sand-900">
              Send us an enquiry
            </h2>
            <p className="mt-1.5 mb-6 text-sm text-sand-600">
              No account needed. Fields marked with an asterisk are required.
            </p>

            <EnquiryForm type="contact" />
          </div>
        </div>
      </Section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'TravelAgency',
            name: clientEnv.NEXT_PUBLIC_SITE_NAME,
            telephone: CONTACT.phone,
            email: CONTACT.email,
            url: `${clientEnv.NEXT_PUBLIC_SITE_URL}/contact`,
            openingHours: 'Mo-Sa 10:00-19:00',
          }),
        }}
      />
    </>
  );
}

function PhoneIcon() {
  return (
    <svg
      className="size-4.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      className="size-4.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  );
}
