/**
 * Registry of the public routes whose SEO is written in code.
 *
 * Packages, destinations, services and blog posts carry their own `seo`
 * subdocument, so they are edited with the entry itself. The routes below have
 * no database record, so their titles and descriptions live here as defaults
 * and an admin override is stored in SiteSetting under `seo.page.<path>`.
 *
 * The defaults must match what the page files declare. They are the fallback
 * when no override exists, and what the admin screen shows as "Default".
 */

export interface StaticPageSeo {
  path: string;
  /** Label for the admin listing. */
  name: string;
  title: string;
  description: string;
}

export const STATIC_PAGES: readonly StaticPageSeo[] = [
  {
    path: '/',
    name: 'Home',
    // Blank so the root layout's default title (which already carries the
    // site name and positioning) is used unless an admin overrides it.
    title: '',
    description:
      'Handcrafted holiday packages, honeymoon getaways and group tours across India and abroad. Talk to a travel expert and travel with confidence.',
  },
  {
    path: '/about',
    name: 'About Us',
    title: 'About Us',
    description:
      'A travel agency run by people who have made these journeys themselves — planning domestic and international trips since 2009.',
  },
  {
    path: '/tours',
    name: 'All Tours',
    title: 'Tour Packages',
    description:
      'Browse domestic and international tour packages with day-wise itineraries, inclusions and transparent pricing.',
  },
  {
    path: '/tours/domestic',
    name: 'Domestic Tours',
    title: 'Domestic Tour Packages in India',
    description:
      'Holiday packages across India — Kashmir, Kerala, Rajasthan, Himachal, Goa and the Andaman Islands, with day-wise itineraries and transparent pricing.',
  },
  {
    path: '/tours/international',
    name: 'International Tours',
    title: 'International Tour Packages',
    description:
      'International holiday packages to Thailand, Dubai, Singapore and Bali — with visa guidance, airport transfers and local support included.',
  },
  {
    path: '/destinations',
    name: 'Destinations',
    title: 'Destinations',
    description:
      'Explore the destinations we cover across India and abroad, with curated tour packages for each.',
  },
  {
    path: '/services',
    name: 'Travel Services',
    title: 'Travel Services',
    description:
      'Hotel booking, chauffeur-driven car rental and flight, rail and bus ticketing — booked individually or bundled into a full itinerary.',
  },
  {
    path: '/gallery',
    name: 'Gallery',
    title: 'Gallery',
    description:
      'Photographs from the journeys we plan — destinations, stays and moments from our travellers.',
  },
  {
    path: '/blog',
    name: 'Travel Journal',
    title: 'Travel Journal',
    description:
      'Destination guides, packing advice and planning notes from the trips we run across India and abroad.',
  },
  {
    path: '/contact',
    name: 'Contact',
    title: 'Contact Us',
    description:
      'Talk to a travel expert about your next trip. Call, WhatsApp or send an enquiry and we will respond within one working day.',
  },
  {
    path: '/rules-and-regulations',
    name: 'Rules & Regulations',
    title: 'Rules and Regulations',
    description:
      'Travel rules, group conduct and practical guidelines that apply to our tours.',
  },
  {
    path: '/privacy-policy',
    name: 'Privacy Policy',
    title: 'Privacy Policy',
    description:
      'How we collect, use and protect your personal information when you enquire or book with us.',
  },
  {
    path: '/terms-and-conditions',
    name: 'Terms & Conditions',
    title: 'Terms and Conditions',
    description:
      'The terms that apply when you book a tour package or travel service with us.',
  },
] as const;

/** Settings key holding the admin override for a page's SEO. */
export function pageSeoKey(path: string): string {
  return `seo.page.${path}`;
}

export function findStaticPage(path: string): StaticPageSeo | undefined {
  return STATIC_PAGES.find((page) => page.path === path);
}
