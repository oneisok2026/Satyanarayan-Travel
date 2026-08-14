import { PackageCard } from './PackageCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ButtonLink } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { getPriceOnRequestText, getSiteContact } from '@/services/contact.service';
import type { TourPackageSummaryDTO } from '@/types';

interface PackageGridProps {
  packages: TourPackageSummaryDTO[];
  /** Leading cards rendered eagerly; the rest lazy-load. */
  eagerCount?: number;
}

/**
 * Server Component.
 *
 * Resolves the enquiry wording and contact address once for the whole grid
 * rather than making every listing page thread them down, and rather than
 * each card looking them up for itself.
 */
export async function PackageGrid({ packages, eagerCount = 3 }: PackageGridProps) {
  if (packages.length === 0) {
    return (
      <EmptyState
        title="No packages match those filters"
        description="Try widening your budget or duration, or tell us what you have in mind and we will build something."
        action={<ButtonLink href="/contact">Request a custom itinerary</ButtonLink>}
      />
    );
  }

  // Only fetched when at least one card needs it.
  const needsMessage = packages.some((pkg) => pkg.priceOnRequest);
  const [priceMessage, contact] = await Promise.all([
    needsMessage ? getPriceOnRequestText() : Promise.resolve(undefined),
    getSiteContact(),
  ]);

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {packages.map((pkg, index) => (
        <ScrollReveal key={pkg.id} delay={(index % 3) * 70}>
          <PackageCard
            package={pkg}
            priority={index < eagerCount}
            priceMessage={priceMessage}
            recipientEmail={contact.primaryEmail?.value}
          />
        </ScrollReveal>
      ))}
    </div>
  );
}
