import type { Metadata } from 'next';
import { NewCatalogueItem } from '@/components/admin/NewCatalogueItem';

export const metadata: Metadata = {
  title: 'New category',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function NewCategoryPage() {
  return (
    <NewCatalogueItem
      resource="categories"
      noun="category"
      backHref="/admin/categories"
      backLabel="All categories"
      initial={{ status: 'published', featured: false, sortOrder: 0 }}
    />
  );
}
