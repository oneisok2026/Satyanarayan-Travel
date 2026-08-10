import type { Metadata } from 'next';
import { LegalPage } from '@/components/layout/LegalPage';

export const revalidate = 86400; // staticPage

export const metadata: Metadata = {
  title: 'Rules and Regulations',
  description:
    'Travel rules, group conduct and practical guidelines that apply to our tours.',
  alternates: { canonical: '/rules-and-regulations' },
};

export default function RulesPage() {
  return (
    <LegalPage
      title="Rules and Regulations"
      description="Practical guidelines that keep our tours running smoothly for everyone."
      crumbLabel="Rules & Regulations"
      href="/rules-and-regulations"
      lastUpdated="10 August 2026"
      sections={[
        {
          heading: 'Punctuality',
          paragraphs: [
            'Group tours run to a schedule that has been planned around driving times, checkout deadlines and site opening hours. Please be ready at the stated departure time. A vehicle may leave without a traveller who is significantly late, and no refund is due for missed components in that case.',
          ],
        },
        {
          heading: 'Identification',
          bullets: [
            'Carry original government-issued photo identification at all times',
            'Hotels in India are legally required to record ID for every adult guest',
            'International travel requires a passport valid for at least six months beyond your return date',
            'Keep a photocopy or digital scan separate from the originals',
          ],
        },
        {
          heading: 'Luggage',
          paragraphs: [
            'One suitcase and one small bag per person is the standard allowance on our vehicles. Mountain and small-vehicle itineraries may require less. Excess luggage may need a separate vehicle at additional cost, so tell us in advance if you expect to exceed this.',
          ],
        },
        {
          heading: 'Health and fitness',
          paragraphs: [
            'Some itineraries involve walking on uneven ground, stairs without handrails, or travel at high altitude. Tell us about any medical condition, mobility limitation or dietary requirement at the time of booking so we can advise honestly on suitability and adjust where possible.',
          ],
        },
        {
          heading: 'High-altitude travel',
          paragraphs: [
            'Itineraries reaching above 3,000 metres carry a risk of altitude sickness. Ascend gradually, stay hydrated, and inform your guide immediately if you experience persistent headache, nausea or breathlessness. Guides may require a traveller to descend on medical grounds, and that decision is final.',
          ],
        },
        {
          heading: 'Children',
          bullets: [
            'Children under 12 must be accompanied by a parent or guardian at all times',
            'Child pricing applies from age 2 to 11; infants under 2 travel free without a separate seat or bed',
            'Some adventure activities have minimum age or height requirements set by the operator',
          ],
        },
        {
          heading: 'Local laws and customs',
          paragraphs: [
            'Travellers are expected to respect local laws, religious practices and dress codes. Many temples and monasteries require covered shoulders and knees, and removal of footwear. Photography is restricted at some sites, and prohibited entirely at certain border and military areas.',
          ],
        },
        {
          heading: 'Alcohol and prohibited substances',
          paragraphs: [
            'Several Indian states prohibit or restrict alcohol, and some destinations require a liquor permit. Narcotic substances are illegal throughout India and carry severe penalties. Any traveller found in possession will be removed from the tour without refund.',
          ],
        },
        {
          heading: 'Personal belongings',
          paragraphs: [
            'You remain responsible for your own belongings throughout the trip. Use hotel safes where available. We are not liable for loss or theft of personal property, which is why travel insurance is strongly recommended.',
          ],
        },
        {
          heading: 'Environmental responsibility',
          bullets: [
            'Carry your waste out of natural areas, particularly in the mountains',
            'Do not feed or approach wildlife',
            'Stay on marked paths in national parks and protected areas',
            'Single-use plastics are banned in several of the destinations we visit',
          ],
        },
      ]}
    />
  );
}
