import type { Metadata } from 'next';
import { NewCatalogueItem } from '@/components/admin/NewCatalogueItem';

export const metadata: Metadata = {
  title: 'New contact detail',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function NewContactDetailPage() {
  return (
    <NewCatalogueItem
      resource="contact-details"
      noun="contact detail"
      backHref="/admin/contact-details"
      backLabel="All contact details"
      initial={{
        kind: 'phone',
        placement: 'both',
        isPrimary: false,
        status: 'published',
        sortOrder: 0,
      }}
    />
  );
}
