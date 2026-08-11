import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdminPage } from '@/lib/firebase/auth';
import { connectToDatabase } from '@/lib/db/connect';
import { TourPackage } from '@/models/TourPackage';
import { Destination } from '@/models/Destination';
import { Service } from '@/models/Service';
import { BlogPost } from '@/models/BlogPost';
import { listSeoTargets } from '@/services/page-seo.service';
import { SeoForm } from '@/components/admin/SeoForm';
import { PageHeading } from '@/components/admin/PageHeading';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { clientEnv } from '@/lib/env';

export const metadata: Metadata = {
  title: 'SEO',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface SeoRow {
  id: string;
  title: string;
  type: string;
  path: string;
  hasTitle: boolean;
  hasDescription: boolean;
  hasKeywords: boolean;
}

/**
 * SEO coverage audit.
 *
 * Surfaces published content missing an SEO title or description. Entries
 * still render correctly without them — the page falls back to its own title
 * and short description — but explicit values give better search results.
 */
export default async function AdminSeoPage() {
  const admin = await requireAdminPage('/admin/seo');

  await connectToDatabase();

  const [packages, destinations, services, posts, targets] = await Promise.all([
    TourPackage.find({ status: 'published' })
      .select('title slug seo')
      .sort({ updatedAt: -1 })
      .lean(),
    Destination.find({ status: 'published' })
      .select('name slug seo')
      .sort({ updatedAt: -1 })
      .lean(),
    Service.find({ status: 'published' })
      .select('name slug seo')
      .sort({ updatedAt: -1 })
      .lean(),
    BlogPost.find({ status: 'published' })
      .select('title slug seo')
      .sort({ updatedAt: -1 })
      .lean(),
    listSeoTargets(),
  ]);

  const rows: SeoRow[] = [
    ...packages.map((doc) => ({
      id: `pkg-${doc._id}`,
      title: doc.title,
      type: 'Package',
      path: `/packages/${doc.slug}`,
      hasTitle: Boolean(doc.seo?.title),
      hasDescription: Boolean(doc.seo?.description),
      hasKeywords: Boolean(doc.seo?.keywords?.length),
    })),
    ...destinations.map((doc) => ({
      id: `dest-${doc._id}`,
      title: doc.name,
      type: 'Destination',
      path: `/destinations/${doc.slug}`,
      hasTitle: Boolean(doc.seo?.title),
      hasDescription: Boolean(doc.seo?.description),
      hasKeywords: Boolean(doc.seo?.keywords?.length),
    })),
    ...services.map((doc) => ({
      id: `svc-${doc._id}`,
      title: doc.name,
      type: 'Service',
      path: `/services/${doc.slug}`,
      hasTitle: Boolean(doc.seo?.title),
      hasDescription: Boolean(doc.seo?.description),
      hasKeywords: Boolean(doc.seo?.keywords?.length),
    })),
    ...posts.map((doc) => ({
      id: `post-${doc._id}`,
      title: doc.title,
      type: 'Blog post',
      path: `/blog/${doc.slug}`,
      hasTitle: Boolean(doc.seo?.title),
      hasDescription: Boolean(doc.seo?.description),
      hasKeywords: Boolean(doc.seo?.keywords?.length),
    })),
  ];


  const incomplete = rows.filter((row) => !row.hasTitle || !row.hasDescription).length;

  const columns: Column<SeoRow>[] = [
    {
      key: 'title',
      header: 'Content',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-sand-900">{row.title}</p>
          <p className="truncate font-mono text-xs text-sand-500">{row.path}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      secondary: true,
      render: (row) => <Badge tone="neutral">{row.type}</Badge>,
    },
    {
      key: 'seoTitle',
      header: 'SEO title',
      render: (row) => (
        <Badge tone={row.hasTitle ? 'success' : 'warning'}>
          {row.hasTitle ? 'Set' : 'Missing'}
        </Badge>
      ),
    },
    {
      key: 'seoDescription',
      header: 'Meta description',
      render: (row) => (
        <Badge tone={row.hasDescription ? 'success' : 'warning'}>
          {row.hasDescription ? 'Set' : 'Missing'}
        </Badge>
      ),
    },
    {
      key: 'seoKeywords',
      header: 'Keywords',
      secondary: true,
      render: (row) => (
        <Badge tone={row.hasKeywords ? 'success' : 'neutral'}>
          {row.hasKeywords ? 'Set' : 'None'}
        </Badge>
      ),
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
        title="SEO"
        description={`${rows.length} published items · ${incomplete} missing SEO fields.`}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <ResourceCard
          title="Sitemap"
          description="Generated from published content."
          href="/sitemap.xml"
        />
        <ResourceCard
          title="Robots"
          description="Crawl rules and sitemap reference."
          href="/robots.txt"
        />
        <ResourceCard
          title="Site URL"
          description={clientEnv.NEXT_PUBLIC_SITE_URL}
          href="/"
        />
      </div>

      {incomplete > 0 && (
        <Alert variant="warning" className="mb-6" title="Missing SEO fields">
          {incomplete} published {incomplete === 1 ? 'item is' : 'items are'} missing
          an SEO title or meta description. Pages still work — they fall back to
          the content title and short description — but explicit values give you
          control over how results appear in search.
        </Alert>
      )}

      {admin.role === 'super_admin' && (
        <section className="mb-8">
          <SeoForm targets={targets} />
        </section>
      )}

      <section>
        <h2 className="mb-1 font-display text-lg font-semibold text-sand-900">
          Coverage
        </h2>
        <p className="mb-4 text-sm text-sand-600">
          Published content and whether each has a title and description set.
        </p>

        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          empty={{
            title: 'No published content',
            description:
              'Publish packages, destinations, services or blog posts to see them here.',
          }}
        />
      </section>
    </>
  );
}

function ResourceCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-2xl bg-white p-5 ring-1 ring-sand-200 transition-shadow hover:shadow-[--shadow-card]"
    >
      <p className="font-medium text-sand-900">{title}</p>
      <p className="mt-1 truncate text-xs text-sand-500">{description}</p>
    </Link>
  );
}
