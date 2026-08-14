import type { Metadata } from 'next';
import { NewCatalogueItem } from '@/components/admin/NewCatalogueItem';
import { PACKAGE_TYPES } from '@/constants';

export const metadata: Metadata = {
  title: 'New package',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function NewPackagePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { type } = await searchParams;

  // Arriving from the Domestic or International sidebar entry preselects the
  // matching type, so the filtered list and the new item agree by default.
  const preset =
    typeof type === 'string' && PACKAGE_TYPES.includes(type as never) ? type : undefined;

  return (
    <NewCatalogueItem
      resource="packages"
      noun="package"
      backHref={preset ? `/admin/packages?type=${preset}` : '/admin/packages'}
      backLabel={preset ? `All ${preset} tours` : 'All packages'}
      // priceOnRequest starts ticked, matching the schema default: a new
      // package must not publish a figure unless someone unticks it.
      initial={{
        status: 'draft',
        type: preset ?? 'domestic',
        featured: false,
        priceOnRequest: true,
      }}
    />
  );
}
