import type { Metadata } from 'next';
import { NewCatalogueItem } from '@/components/admin/NewCatalogueItem';

export const metadata: Metadata = {
  title: 'New social link',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function NewSocialLinkPage() {
  return (
    <NewCatalogueItem
      resource="social-links"
      noun="social link"
      backHref="/admin/social-links"
      backLabel="All links"
      initial={{ platform: 'facebook', status: 'published', sortOrder: 0 }}
    />
  );
}
