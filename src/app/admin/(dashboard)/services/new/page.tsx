import type { Metadata } from 'next';
import { NewCatalogueItem } from '@/components/admin/NewCatalogueItem';

export const metadata: Metadata = {
  title: 'New service',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function NewServicePage() {
  return (
    <NewCatalogueItem
      resource="services"
      noun="service"
      backHref="/admin/services"
      backLabel="All services"
      initial={{ status: 'published', featured: false, sortOrder: 0 }}
    />
  );
}
