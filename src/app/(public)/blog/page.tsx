import type { Metadata } from 'next';
import { PageHero } from '@/components/layout/PageHero';
import { BlogCard } from '@/components/blog/BlogCard';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { listPublishedPosts } from '@/services/content.service';
import { blogListQuerySchema } from '@/lib/validation/catalog.schema';

export const revalidate = 600; // blog

export const metadata: Metadata = {
  title: 'Travel Journal',
  description:
    'Destination guides, packing advice and planning notes from the trips we run across India and abroad.',
  alternates: { canonical: '/blog' },
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const parsed = blogListQuerySchema.safeParse(raw);
  const query = parsed.success ? parsed.data : blogListQuerySchema.parse({});

  const { posts, total } = await listPublishedPosts(query);
  const totalPages = Math.ceil(total / query.limit);

  return (
    <>
      <PageHero
        eyebrow="Travel journal"
        title="Guides and planning notes"
        description="Practical advice written by the people who plan and run these trips."
        crumbs={[{ href: '/blog', label: 'Blog' }]}
        image={{
          url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1800&q=70',
          alt: '',
        }}
      />

      <div className="container-page py-12 lg:py-16">
        {posts.length === 0 ? (
          <EmptyState
            title="No articles yet"
            description="We are writing our first guides. Check back shortly."
          />
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, index) => (
                <ScrollReveal key={post.id} delay={(index % 3) * 70}>
                  <BlogCard post={post} priority={index < 3} />
                </ScrollReveal>
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination
                className="mt-12"
                page={query.page}
                totalPages={totalPages}
                buildHref={(page) => (page > 1 ? `/blog?page=${page}` : '/blog')}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}
