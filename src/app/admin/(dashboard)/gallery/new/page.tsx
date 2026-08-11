import type { Metadata } from 'next';
import { NewCatalogueItem } from '@/components/admin/NewCatalogueItem';

export const metadata: Metadata = {
  title: 'New gallery image',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function NewGalleryItemPage() {
  return (
    <NewCatalogueItem
      resource="gallery"
      noun="gallery image"
      backHref="/admin/gallery"
      backLabel="All images"
      initial={{ status: 'published', sortOrder: 0 }}
    />
  );
}
