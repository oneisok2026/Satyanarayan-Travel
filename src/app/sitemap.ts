import type { MetadataRoute } from 'next';
import { clientEnv } from '@/lib/env';
import { connectToDatabase } from '@/lib/db/connect';
import { TourPackage } from '@/models/TourPackage';
import { Destination } from '@/models/Destination';
import { BlogPost } from '@/models/BlogPost';
import { Service } from '@/models/Service';
import { logger } from '@/lib/logger';

const BASE = clientEnv.NEXT_PUBLIC_SITE_URL;

export const revalidate = 3600;

/**
 * Dynamic sitemap.
 *
 * Only published content is listed. Account and admin routes are excluded
 * entirely — they are noindex and require a session.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/tours`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/tours/domestic`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/tours/international`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/destinations`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/services`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/gallery`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/blog`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/contact`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/rules-and-regulations`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/privacy-policy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/terms-and-conditions`, changeFrequency: 'yearly', priority: 0.3 },
  ];

  try {
    await connectToDatabase();

    const [packages, destinations, posts, services] = await Promise.all([
      TourPackage.find({ status: 'published' }).select('slug updatedAt').lean(),
      Destination.find({ status: 'published' }).select('slug updatedAt').lean(),
      BlogPost.find({ status: 'published', publishedAt: { $lte: new Date() } })
        .select('slug updatedAt')
        .lean(),
      Service.find({ status: 'published' }).select('slug updatedAt').lean(),
    ]);

    return [
      ...staticRoutes,
      ...packages.map((item) => ({
        url: `${BASE}/packages/${item.slug}`,
        lastModified: item.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
      ...destinations.map((item) => ({
        url: `${BASE}/destinations/${item.slug}`,
        lastModified: item.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
      ...posts.map((item) => ({
        url: `${BASE}/blog/${item.slug}`,
        lastModified: item.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      })),
      ...services.map((item) => ({
        url: `${BASE}/services/${item.slug}`,
        lastModified: item.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      })),
    ];
  } catch (error) {
    // A database outage must not break the sitemap entirely.
    logger.error('Sitemap generation fell back to static routes', {
      error: error instanceof Error ? error : String(error),
    });
    return staticRoutes;
  }
}
