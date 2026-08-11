import type { Metadata } from 'next';
import { NewCatalogueItem } from '@/components/admin/NewCatalogueItem';

export const metadata: Metadata = {
  title: 'New destination',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function NewDestinationPage() {
  return (
    <NewCatalogueItem
      resource="destinations"
      noun="destination"
      backHref="/admin/destinations"
      backLabel="All destinations"
      initial={{ status: 'draft', type: 'domestic', featured: false, sortOrder: 0 }}
    />
  );
}
