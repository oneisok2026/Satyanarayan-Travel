import type { Metadata } from 'next';
import { NewCatalogueItem } from '@/components/admin/NewCatalogueItem';

export const metadata: Metadata = {
  title: 'New article',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function NewBlogPage() {
  return (
    <NewCatalogueItem
      resource="blogs"
      noun="article"
      backHref="/admin/blogs"
      backLabel="All articles"
      initial={{ status: 'draft', readingMinutes: 3 }}
    />
  );
}
