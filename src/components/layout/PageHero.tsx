import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface Crumb {
  href: string;
  label: string;
}

interface PageHeroProps {
  title: string;
  description?: string;
  eyebrow?: string;
  image?: { url: string; alt: string };
  crumbs?: Crumb[];
  children?: React.ReactNode;
}

/**
 * Shared page banner with breadcrumbs.
 *
 * Emits BreadcrumbList structured data alongside the visual trail, which is
 * what search engines use to render breadcrumbs in results.
 */
export function PageHero({
  title,
  description,
  eyebrow,
  image,
  crumbs = [],
  children,
}: PageHeroProps) {
  const hasImage = Boolean(image);

  return (
    <section
      className={cn(
        'relative isolate overflow-hidden',
        hasImage ? 'bg-brand-950' : 'bg-brand-900',
      )}
    >
      {image && (
        <>
          <Image
            src={image.url}
            alt=""
            fill
            priority
            sizes="100vw"
            quality={70}
            aria-hidden="true"
            className="-z-10 object-cover opacity-45"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-950/85 via-brand-950/60 to-brand-950/40"
          />
        </>
      )}

      <div className="container-page py-14 lg:py-20">
        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-5">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-sand-400">
              <li>
                <Link href="/" className="transition-colors hover:text-white">
                  Home
                </Link>
              </li>
              {crumbs.map((crumb, index) => (
                <li key={crumb.href} className="flex items-center gap-1.5">
                  <span aria-hidden="true">/</span>
                  {index === crumbs.length - 1 ? (
                    <span className="text-sand-200" aria-current="page">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="transition-colors hover:text-white"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {eyebrow && (
          <p className="animate-fade-down text-xs font-semibold tracking-[0.18em] text-accent-300 uppercase">
            {eyebrow}
          </p>
        )}

        <h1 className="animate-fade-up mt-2 max-w-3xl font-display text-3xl leading-tight font-semibold text-white sm:text-4xl lg:text-5xl">
          {title}
        </h1>

        {description && (
          <p
            className="animate-fade-up mt-4 max-w-2xl text-[0.9375rem] leading-relaxed text-sand-300 sm:text-base"
            style={{ animationDelay: '80ms' }}
          >
            {description}
          </p>
        )}

        {children && <div className="mt-6">{children}</div>}
      </div>

      {crumbs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: '/' },
                ...crumbs.map((crumb, index) => ({
                  '@type': 'ListItem',
                  position: index + 2,
                  name: crumb.label,
                  item: crumb.href,
                })),
              ],
            }),
          }}
        />
      )}
    </section>
  );
}
