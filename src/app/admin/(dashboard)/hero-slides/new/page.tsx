import type { Metadata } from 'next';
import { NewCatalogueItem } from '@/components/admin/NewCatalogueItem';

export const metadata: Metadata = {
  title: 'New hero slide',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function NewHeroSlidePage() {
  return (
    <NewCatalogueItem
      resource="hero-slides"
      noun="hero slide"
      backHref="/admin/hero-slides"
      backLabel="All slides"
      initial={{ status: 'published', sortOrder: 0 }}
    />
  );
}
