import { clientEnv } from '@/lib/env';
import { buildWhatsAppUrl, normalizePhone } from '@/lib/utils';

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
      { href: '/services/car-rental', label: 'Car Rental' },
      { href: '/services/e-ticket-booking', label: 'E-Ticket Booking' },
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
    { href: '/services/car-rental', label: 'Car Rental' },
    { href: '/services/e-ticket-booking', label: 'E-Ticket Booking' },
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

/** Contact details, resolved once from validated public env. */
export const CONTACT = {
  phone: clientEnv.NEXT_PUBLIC_CONTACT_PHONE,
  phoneHref: `tel:${normalizePhone(clientEnv.NEXT_PUBLIC_CONTACT_PHONE)}`,
  email: clientEnv.NEXT_PUBLIC_CONTACT_EMAIL,
  emailHref: `mailto:${clientEnv.NEXT_PUBLIC_CONTACT_EMAIL}`,
  whatsapp: clientEnv.NEXT_PUBLIC_WHATSAPP_NUMBER,
  whatsappUrl: buildWhatsAppUrl(
    clientEnv.NEXT_PUBLIC_WHATSAPP_NUMBER,
    "Hello! I'd like to know more about your tour packages.",
  ),
} as const;
