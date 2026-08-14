export interface NavItem {
  href: string;
  label: string;
  children?: NavItem[];
}

/** Primary navigation. Mirrors the public route map in PART 17. */
export const MAIN_NAV: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  {
    href: '/tours',
    label: 'Tours',
    children: [
      { href: '/tours', label: 'All Packages' },
      { href: '/tours/domestic', label: 'Domestic Tours' },
      { href: '/tours/international', label: 'International Tours' },
    ],
  },
  { href: '/destinations', label: 'Destinations' },
  {
    href: '/services',
    label: 'Services',
    children: [
      { href: '/services', label: 'All Services' },
      { href: '/services/hotel-booking', label: 'Hotel Booking' },
      { href: '/services/car-bus-rental', label: 'Car/Bus Rental' },
      { href: '/services/railway-ticket-booking', label: 'Railway Ticket Booking' },
      { href: '/services/flight-ticket-booking', label: 'Flight Ticket Booking' },
    ],
  },
  { href: '/gallery', label: 'Gallery' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
];

export const FOOTER_NAV = {
  explore: [
    { href: '/tours/domestic', label: 'Domestic Tours' },
    { href: '/tours/international', label: 'International Tours' },
    { href: '/destinations', label: 'Destinations' },
    { href: '/gallery', label: 'Gallery' },
    { href: '/blog', label: 'Travel Journal' },
  ],
  services: [
    { href: '/services/hotel-booking', label: 'Hotel Booking' },
    { href: '/services/car-bus-rental', label: 'Car/Bus Rental' },
    { href: '/services/railway-ticket-booking', label: 'Railway Ticket Booking' },
    { href: '/services/flight-ticket-booking', label: 'Flight Ticket Booking' },
    { href: '/contact', label: 'Plan a Custom Trip' },
  ],
  company: [
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact' },
    { href: '/rules-and-regulations', label: 'Rules & Regulations' },
    { href: '/privacy-policy', label: 'Privacy Policy' },
    { href: '/terms-and-conditions', label: 'Terms & Conditions' },
  ],
} as const;

/*
 * Contact details are no longer resolved here.
 *
 * They are managed by the super admin and stored in the database, so they are
 * fetched per request by `getSiteContact()` in services/contact.service.ts and
 * passed down as props. The NEXT_PUBLIC_CONTACT_* values survive as that
 * service's fallback.
 */
