import { PackageCard } from './PackageCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ButtonLink } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import type { TourPackageSummaryDTO } from '@/types';

interface PackageGridProps {
  packages: TourPackageSummaryDTO[];
  /** Leading cards rendered eagerly; the rest lazy-load. */
  eagerCount?: number;
}

export function PackageGrid({ packages, eagerCount = 3 }: PackageGridProps) {
  if (packages.length === 0) {
    return (
      <EmptyState
        title="No packages match those filters"
        description="Try widening your budget or duration, or tell us what you have in mind and we will build something."
        action={<ButtonLink href="/contact">Request a custom itinerary</ButtonLink>}
      />
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {packages.map((pkg, index) => (
        <ScrollReveal key={pkg.id} delay={(index % 3) * 70}>
          <PackageCard package={pkg} priority={index < eagerCount} />
        </ScrollReveal>
      ))}
    </div>
  );
}
