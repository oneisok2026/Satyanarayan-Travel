import type { Metadata } from 'next';
import { buildPageMetadata } from '@/services/page-seo.service';
import { LegalPage } from '@/components/layout/LegalPage';
import { CONTACT } from '@/constants/navigation';

export const revalidate = 86400; // staticPage

export function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('/privacy-policy');
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="What we collect, why we collect it, and the choices you have."
      crumbLabel="Privacy Policy"
      href="/privacy-policy"
      lastUpdated="10 August 2026"
      sections={[
        {
          heading: 'Information we collect',
          paragraphs: [
            'When you send an enquiry or make a booking, we collect the details you provide directly:',
          ],
          bullets: [
            'Name, email address and phone number',
            'Travel dates, destination preferences and number of travellers',
            'Traveller names and ages, where required for a booking',
            'Any message or requirements you choose to share',
          ],
        },
        {
          heading: 'Authentication data',
          paragraphs: [
            'Accounts are managed through Firebase Authentication, operated by Google. Your password is held by Firebase and is never stored on our servers or in our database. We store only your Firebase user identifier, your email address and the profile details you enter.',
          ],
        },
        {
          heading: 'How we use your information',
          bullets: [
            'To respond to your enquiry and prepare an itinerary',
            'To make and manage bookings with hotels, transport operators and airlines',
            'To contact you about a trip you have booked',
            'To send offers and travel updates, only where you have opted in',
            'To meet legal, tax and regulatory obligations',
          ],
        },
        {
          heading: 'Sharing with third parties',
          paragraphs: [
            'We share your details with suppliers only to the extent needed to deliver your trip — hotels, transport operators, airlines and, where applicable, visa processing agents. We do not sell your personal information, and we do not share it for third-party advertising.',
          ],
        },
        {
          heading: 'Data retention',
          paragraphs: [
            'Enquiry records are retained for up to three years so we can reference previous conversations. Booking records are retained for the period required by applicable tax and accounting law. You may request earlier deletion, subject to those obligations.',
          ],
        },
        {
          heading: 'Security',
          paragraphs: [
            'Data is transmitted over encrypted connections and stored on managed infrastructure with access controls. Sessions use HTTP-only cookies. No system can be guaranteed completely secure, but we take reasonable measures appropriate to the sensitivity of the data we hold.',
          ],
        },
        {
          heading: 'Your rights',
          bullets: [
            'Request a copy of the personal information we hold about you',
            'Ask us to correct information that is inaccurate',
            'Request deletion, subject to our legal retention obligations',
            'Withdraw marketing consent at any time',
          ],
        },
        {
          heading: 'Cookies',
          paragraphs: [
            'We use a session cookie to keep you signed in. It is HTTP-only, meaning it cannot be read by scripts in your browser. We do not use third-party advertising or cross-site tracking cookies.',
          ],
        },
        {
          heading: 'Contact us',
          paragraphs: [
            `For any privacy question or request, contact us at ${CONTACT.email} or call ${CONTACT.phone}.`,
          ],
        },
      ]}
    />
  );
}
