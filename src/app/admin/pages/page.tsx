import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdminPage } from '@/lib/firebase/auth';
import { PageHeading } from '@/components/admin/PageHeading';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';

export const metadata: Metadata = {
  title: 'Pages',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface PageRow {
  path: string;
  title: string;
  kind: 'Static' | 'Dynamic' | 'Listing';
  source: string;
}

/**
 * Inventory of the public routes.
 *
 * These pages are code, not CMS records — listing them here gives an admin a
 * single place to see and preview the public surface without implying they
 * are editable from the database.
 */
const PAGES: PageRow[] = [
  { path: '/', title: 'Home', kind: 'Dynamic', source: 'Packages, destinations, blog, gallery' },
  { path: '/about', title: 'About Us', kind: 'Static', source: 'Page content' },
  { path: '/tours', title: 'All Tours', kind: 'Listing', source: 'Packages' },
  { path: '/tours/domestic', title: 'Domestic Tours', kind: 'Listing', source: 'Packages' },
  { path: '/tours/international', title: 'International Tours', kind: 'Listing', source: 'Packages' },
  { path: '/destinations', title: 'Destinations', kind: 'Listing', source: 'Destinations' },
  { path: '/services', title: 'Travel Services', kind: 'Listing', source: 'Services' },
  { path: '/gallery', title: 'Gallery', kind: 'Listing', source: 'Gallery' },
  { path: '/blog', title: 'Travel Journal', kind: 'Listing', source: 'Blog posts' },
  { path: '/contact', title: 'Contact', kind: 'Static', source: 'Enquiry form' },
  { path: '/rules-and-regulations', title: 'Rules & Regulations', kind: 'Static', source: 'Page content' },
  { path: '/privacy-policy', title: 'Privacy Policy', kind: 'Static', source: 'Page content' },
  { path: '/terms-and-conditions', title: 'Terms & Conditions', kind: 'Static', source: 'Page content' },
];

export default async function AdminPagesPage() {
  await requireAdminPage('/admin/pages');

  const columns: Column<PageRow>[] = [
    {
      key: 'title',
      header: 'Page',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-sand-900">{row.title}</p>
          <p className="truncate font-mono text-xs text-sand-500">{row.path}</p>
        </div>
      ),
    },
    {
      key: 'kind',
      header: 'Type',
      render: (row) => (
        <Badge tone={row.kind === 'Static' ? 'neutral' : 'brand'}>{row.kind}</Badge>
      ),
    },
    {
      key: 'source',
      header: 'Content from',
      secondary: true,
      render: (row) => <span className="text-sm text-sand-600">{row.source}</span>,
    },
    {
      key: 'view',
      header: 'View',
      align: 'right',
      render: (row) => (
        <Link
          href={row.path}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-brand-700 underline-offset-4 hover:underline"
        >
          Preview
        </Link>
      ),
    },
  ];

  return (
    <>
      <PageHeading
        title="Pages"
        description="Every public route on the website and where its content comes from."
      />

      <Alert variant="info" className="mb-6" title="How these pages work">
        Listing pages read live from the database — edit them in{' '}
        <Link href="/admin/packages" className="underline underline-offset-4">
          Packages
        </Link>
        ,{' '}
        <Link href="/admin/destinations" className="underline underline-offset-4">
          Destinations
        </Link>{' '}
        and the other catalogue screens. Static pages such as About and the
        policies are part of the codebase.
      </Alert>

      <DataTable
        columns={columns}
        rows={PAGES}
        rowKey={(row) => row.path}
        empty={{ title: 'No pages', description: '' }}
      />
    </>
  );
}
