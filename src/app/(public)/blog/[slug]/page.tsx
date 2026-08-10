import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Section, SectionHeading } from '@/components/ui/Section';
import { BlogCard } from '@/components/blog/BlogCard';
import { PageHero } from '@/components/layout/PageHero';
import { getPublishedPostBySlug, getRelatedPosts } from '@/services/content.service';
import { isAppError } from '@/lib/errors';
import { clientEnv } from '@/lib/env';
import { formatDate, truncate, stripHtml } from '@/lib/utils';

export const revalidate = 600; // blog

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const post = await getPublishedPostBySlug(slug);
    const description = post.seo?.description ?? truncate(stripHtml(post.excerpt), 155);

    return {
      title: post.seo?.title ?? post.title,
      description,
      alternates: { canonical: `/blog/${post.slug}` },
      openGraph: {
        type: 'article',
        title: post.title,
        description,
        url: `${clientEnv.NEXT_PUBLIC_SITE_URL}/blog/${post.slug}`,
        publishedTime: post.publishedAt,
        authors: [post.author.name],
        images: [{ url: post.coverImage.url, alt: post.coverImage.alt }],
      },
    };
  } catch {
    return { title: 'Article not found', robots: { index: false } };
  }
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let post;
  try {
    post = await getPublishedPostBySlug(slug);
  } catch (error) {
    if (isAppError(error) && error.code === 'NOT_FOUND') notFound();
    throw error;
  }

  const related = await getRelatedPosts(post.id, 3);

  return (
    <>
      <PageHero
        eyebrow={post.category ?? 'Travel journal'}
        title={post.title}
        crumbs={[
          { href: '/blog', label: 'Blog' },
          { href: `/blog/${post.slug}`, label: post.title },
        ]}
        image={{ url: post.coverImage.url, alt: '' }}
      >
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-sand-300">
          <span>{post.author.name}</span>
          {post.publishedAt && (
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          )}
          <span>{post.readingMinutes} min read</span>
        </div>
      </PageHero>

      <article className="container-page py-12 lg:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-2xl bg-sand-200">
            <Image
              src={post.coverImage.url}
              alt={post.coverImage.alt || post.title}
              fill
              priority
              sizes="(min-width:768px) 48rem, 100vw"
              className="object-cover"
            />
          </div>

          {/*
            Content is authored by admins through the CMS, not by the public,
            so rendering it as HTML is a trusted-author decision, not user input.
          */}
          <div
            className="prose-travel"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {post.tags.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2 border-t border-sand-200 pt-6">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-sand-100 px-3 py-1 text-xs font-medium text-sand-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>

      {related.length > 0 && (
        <Section tone="muted" aria-labelledby="related-articles">
          <SectionHeading
            id="related-articles"
            eyebrow="Keep reading"
            title="Related articles"
            align="left"
          />
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <BlogCard key={item.id} post={item} />
            ))}
          </div>
        </Section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt,
            image: post.coverImage.url,
            datePublished: post.publishedAt,
            dateModified: post.updatedAt,
            author: { '@type': 'Organization', name: post.author.name },
            mainEntityOfPage: `${clientEnv.NEXT_PUBLIC_SITE_URL}/blog/${post.slug}`,
          }),
        }}
      />
    </>
  );
}
