import type { Metadata } from 'next';
import { buildPageMetadata } from '@/services/page-seo.service';
import { LegalPage } from '@/components/layout/LegalPage';
import { CONTACT } from '@/constants/navigation';

export const revalidate = 86400; // staticPage

export function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('/terms-and-conditions');
}

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms and Conditions"
      description="The terms that apply when you book with us."
      crumbLabel="Terms & Conditions"
      href="/terms-and-conditions"
      lastUpdated="10 August 2026"
      sections={[
        {
          heading: 'Booking and confirmation',
          paragraphs: [
            'Submitting a booking request through this website does not create a confirmed reservation. A booking is confirmed only once we have verified availability with our suppliers and issued a written confirmation quoting your booking reference.',
            'Prices shown are indicative and subject to availability at the time of confirmation. Where a supplier price changes before confirmation, we will inform you before proceeding.',
          ],
        },
        {
          heading: 'Payment',
          paragraphs: [
            'Payment terms are specified at the time of confirmation and typically require an advance deposit with the balance due before departure. Failure to pay the balance by the stated date may result in cancellation and forfeiture of the deposit.',
          ],
        },
        {
          heading: 'Cancellation by you',
          paragraphs: [
            'Cancellation charges depend on how far in advance you cancel and on the terms of the individual suppliers. Charges are set out in your booking confirmation. Certain components — notably air tickets and non-refundable hotel rates — may be non-refundable from the moment of booking.',
          ],
        },
        {
          heading: 'Cancellation or change by us',
          paragraphs: [
            'We may need to alter an itinerary because of weather, road conditions, supplier failure or circumstances beyond our control. Where a material change is necessary we will offer a comparable alternative or a refund of the affected component.',
          ],
        },
        {
          heading: 'Travel documents',
          paragraphs: [
            'You are responsible for holding a valid passport, visas, permits and any required vaccinations. We provide guidance and, where offered, visa assistance, but the final responsibility rests with the traveller. We are not liable for denied boarding or entry resulting from inadequate documentation.',
          ],
        },
        {
          heading: 'Travel insurance',
          paragraphs: [
            'We strongly recommend comprehensive travel insurance covering medical treatment, trip cancellation, curtailment and baggage. For adventure activities and high-altitude travel, confirm your policy covers the specific activities involved.',
          ],
        },
        {
          heading: 'Liability',
          paragraphs: [
            'We act as an agent for hotels, transport operators, airlines and other suppliers. Their own terms apply to the services they provide. We are not liable for loss, injury or delay arising from the acts or omissions of independent suppliers, or from events beyond our reasonable control.',
          ],
        },
        {
          heading: 'Conduct',
          paragraphs: [
            'We may decline to carry, or may remove from a tour, any traveller whose conduct endangers others or seriously disrupts the group. No refund is payable in such cases.',
          ],
        },
        {
          heading: 'Complaints',
          paragraphs: [
            `If something is wrong during your trip, tell your guide or call us immediately on ${CONTACT.phone} so we can attempt to resolve it while you are still travelling. Complaints raised only after return are considerably harder to remedy.`,
          ],
        },
        {
          heading: 'Governing law',
          paragraphs: [
            'These terms are governed by the laws of India, and disputes are subject to the exclusive jurisdiction of the courts at our registered place of business.',
          ],
        },
      ]}
    />
  );
}
