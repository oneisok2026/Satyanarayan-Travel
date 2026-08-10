import { Section, SectionHeading } from '@/components/ui/Section';
import { ButtonLink } from '@/components/ui/Button';

/**
 * Placeholder home page for the Phase 1 foundation gate.
 * Replaced by the full composed homepage in Phase 17/18.
 */
export default function HomePage() {
  return (
    <main id="main-content">
      <Section>
        <SectionHeading
          as="h1"
          eyebrow="Foundation ready"
          title="Satyanarayan Travel"
          description="The application shell, design system and error handling are in place. Public pages arrive in the frontend phase."
        />
        <div className="mt-8 flex justify-center">
          <ButtonLink href="/tours">Browse tours</ButtonLink>
        </div>
      </Section>
    </main>
  );
}
