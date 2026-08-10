import Image from 'next/image';
import Link from 'next/link';
import { cn, formatDate } from '@/lib/utils';
import type { BlogPostDTO } from '@/types';

interface BlogCardProps {
  post: Omit<BlogPostDTO, 'content'>;
  priority?: boolean;
  className?: string;
}

export function BlogCard({ post, priority = false, className }: BlogCardProps) {
  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl bg-white',
        'shadow-[--shadow-card] ring-1 ring-sand-200/70',
        'transition-[box-shadow,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
        'hover:-translate-y-1 hover:shadow-[--shadow-card-hover]',
        'motion-reduce:transform-none motion-reduce:transition-none',
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-sand-200">
        <Image
          src={post.coverImage.url}
          alt={post.coverImage.alt || post.title}
          fill
          sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
          priority={priority}
          loading={priority ? undefined : 'lazy'}
          className={cn(
            'object-cover transition-transform duration-700',
            'ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105',
            'motion-reduce:transform-none motion-reduce:transition-none',
          )}
        />
        {post.category && (
          <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[0.6875rem] font-semibold text-brand-800">
            {post.category}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-2 text-xs text-sand-500">
          {post.publishedAt && (
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          )}
          <span aria-hidden="true">·</span>
          <span>{post.readingMinutes} min read</span>
        </div>

        <h3 className="font-display text-lg leading-snug font-semibold text-sand-900">
          <Link href={`/blog/${post.slug}`} className="before:absolute before:inset-0">
            <span className="line-clamp-2">{post.title}</span>
          </Link>
        </h3>

        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-sand-600">
          {post.excerpt}
        </p>

        <span className="mt-auto flex items-center gap-1.5 pt-4 text-sm font-medium text-accent-700">
          Read article
          <svg
            className={cn(
              'size-4 transition-transform duration-200 group-hover:translate-x-1',
              'motion-reduce:transform-none motion-reduce:transition-none',
            )}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </article>
  );
}
