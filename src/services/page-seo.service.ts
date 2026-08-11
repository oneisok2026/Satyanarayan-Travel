import 'server-only';

import type { Metadata } from 'next';
import { cache } from 'react';
import { connectToDatabase } from '@/lib/db/connect';
import { SiteSetting } from '@/models/SiteSetting';
import { TourPackage } from '@/models/TourPackage';
import { Destination } from '@/models/Destination';
import { Service } from '@/models/Service';
import { BlogPost } from '@/models/BlogPost';
import { STATIC_PAGES, findStaticPage, pageSeoKey } from '@/constants/static-pages';
import { logger } from '@/lib/logger';

/**
 * SEO for routes that have no database record of their own.
 *
 * Overrides are stored one document per page under `seo.page.<path>`, matching
 * how SiteSetting is used elsewhere: a concurrent edit to one page cannot
 * clobber another.
 *
 * Reads are deliberately failure-tolerant. A page must still render if the
 * database is unreachable, so a lookup failure falls back to the value
 * compiled into the route rather than throwing during metadata generation.
 */

export interface PageSeoValues {
  title: string;
  description: string;
  keywords: string[];
}

export interface PageSeoRow extends PageSeoValues {
  path: string;
  name: string;
  /** Code defaults, shown as placeholders in the editor. */
  defaultTitle: string;
  defaultDescription: string;
  titleOverridden: boolean;
  descriptionOverridden: boolean;
}

/** One selectable entry in the SEO page picker. */
export interface SeoTarget {
  /** `page:/about` or `packages:<id>` — unique across both kinds. */
  value: string;
  label: string;
  group: string;
  path: string;
  title: string;
  description: string;
  keywords: string[];
  defaultTitle: string;
  defaultDescription: string;
}

function readOverride(value: unknown): Partial<PageSeoValues> {
  if (!value || typeof value !== 'object') return {};
  const record = value as Record<string, unknown>;

  return {
    title: typeof record.title === 'string' ? record.title.trim() : undefined,
    description:
      typeof record.description === 'string' ? record.description.trim() : undefined,
    keywords: Array.isArray(record.keywords)
      ? record.keywords.filter((entry): entry is string => typeof entry === 'string')
      : undefined,
  };
}

/**
 * Resolved SEO for one static page: the admin override where set, the code
 * default otherwise. Wrapped in React `cache` so a page rendering its own
 * metadata and body shares one query.
 */
export const getPageSeo = cache(async (path: string): Promise<PageSeoValues> => {
  const fallback = findStaticPage(path);
  const defaults: PageSeoValues = {
    title: fallback?.title ?? '',
    description: fallback?.description ?? '',
    keywords: [],
  };

  try {
    await connectToDatabase();
    const document = await SiteSetting.findOne({ key: pageSeoKey(path) })
      .select('value')
      .lean();

    const override = readOverride(document?.value);

    return {
      title: override.title || defaults.title,
      description: override.description || defaults.description,
      keywords: override.keywords?.length ? override.keywords : defaults.keywords,
    };
  } catch (error) {
    // Never fail a page render over its metadata.
    logger.warn('page-seo lookup failed; using code defaults', { path, error });
    return defaults;
  }
});

/**
 * Metadata for a static page, with the override applied.
 *
 * `title` is omitted when empty so the root layout's template still supplies
 * the site name — the home page relies on that.
 */
export async function buildPageMetadata(path: string): Promise<Metadata> {
  const { title, description, keywords } = await getPageSeo(path);

  return {
    ...(title ? { title } : {}),
    description,
    ...(keywords.length ? { keywords } : {}),
    alternates: { canonical: path },
    openGraph: { ...(title ? { title } : {}), description, url: path },
  };
}

/** Every static page with its resolved values. */
export async function listPageSeo(): Promise<PageSeoRow[]> {
  await connectToDatabase();

  const documents = await SiteSetting.find({ key: { $regex: '^seo\\.page\\.' } })
    .select('key value')
    .lean();

  const overrides = new Map<string, Partial<PageSeoValues>>();
  for (const document of documents) {
    overrides.set(document.key, readOverride(document.value));
  }

  return STATIC_PAGES.map((page) => {
    const override = overrides.get(pageSeoKey(page.path)) ?? {};

    return {
      path: page.path,
      name: page.name,
      title: override.title || page.title,
      description: override.description || page.description,
      keywords: override.keywords ?? [],
      defaultTitle: page.title,
      defaultDescription: page.description,
      titleOverridden: Boolean(override.title),
      descriptionOverridden: Boolean(override.description),
    };
  });
}

/**
 * Every page an admin can write SEO for: the fixed routes plus each published
 * catalogue entry, so one screen covers the whole public surface.
 */
export async function listSeoTargets(): Promise<SeoTarget[]> {
  await connectToDatabase();

  const [pages, packages, destinations, services, posts] = await Promise.all([
    listPageSeo(),
    TourPackage.find({ status: 'published' }).select('title slug seo').sort({ title: 1 }).lean(),
    Destination.find({ status: 'published' }).select('name slug seo').sort({ name: 1 }).lean(),
    Service.find({ status: 'published' }).select('name slug seo').sort({ name: 1 }).lean(),
    BlogPost.find({ status: 'published' }).select('title slug seo').sort({ title: 1 }).lean(),
  ]);

  const targets: SeoTarget[] = pages.map((page) => ({
    value: `page:${page.path}`,
    label: page.name,
    group: 'Site pages',
    path: page.path,
    title: page.titleOverridden ? page.title : '',
    description: page.descriptionOverridden ? page.description : '',
    keywords: page.keywords,
    defaultTitle: page.defaultTitle,
    defaultDescription: page.defaultDescription,
  }));

  /** Catalogue entries store SEO on the record, so their default is its own title. */
  const fromContent = (
    documents: Record<string, unknown>[],
    resource: string,
    group: string,
    nameKey: 'title' | 'name',
    prefix: string,
  ) =>
    documents.map((document) => {
      const seo = (document.seo ?? {}) as Record<string, unknown>;
      const name = String(document[nameKey] ?? 'Untitled');

      return {
        value: `${resource}:${String(document._id)}`,
        label: `${group} — ${name}`,
        group,
        path: `${prefix}/${String(document.slug)}`,
        title: typeof seo.title === 'string' ? seo.title : '',
        description: typeof seo.description === 'string' ? seo.description : '',
        keywords: Array.isArray(seo.keywords)
          ? (seo.keywords as unknown[]).filter(
              (entry): entry is string => typeof entry === 'string',
            )
          : [],
        defaultTitle: name,
        defaultDescription: '',
      } satisfies SeoTarget;
    });

  return [
    ...targets,
    ...fromContent(packages, 'packages', 'Package', 'title', '/packages'),
    ...fromContent(destinations, 'destinations', 'Destination', 'name', '/destinations'),
    ...fromContent(services, 'services', 'Service', 'name', '/services'),
    ...fromContent(posts, 'blogs', 'Blog', 'title', '/blog'),
  ];
}

const CONTENT_MODELS = {
  packages: TourPackage,
  destinations: Destination,
  services: Service,
  blogs: BlogPost,
} as const;

export type SeoContentResource = keyof typeof CONTENT_MODELS;

export function isSeoContentResource(value: string): value is SeoContentResource {
  return value in CONTENT_MODELS;
}

/**
 * Writes SEO onto a catalogue record.
 *
 * Only the three `seo.*` paths are touched, so this cannot disturb the rest of
 * the document even though it shares an endpoint with the page overrides.
 */
export async function saveContentSeo(
  resource: SeoContentResource,
  id: string,
  values: PageSeoValues,
): Promise<{ path: string } | null> {
  await connectToDatabase();

  const model = CONTENT_MODELS[resource] as unknown as import('mongoose').Model<
    Record<string, unknown>
  >;

  const updated = await model
    .findByIdAndUpdate(
      id,
      {
        $set: {
          'seo.title': values.title.trim(),
          'seo.description': values.description.trim(),
          'seo.keywords': values.keywords,
        },
      },
      { new: true },
    )
    .select('slug')
    .lean<{ slug?: string }>();

  if (!updated) return null;

  const prefix = {
    packages: '/packages',
    destinations: '/destinations',
    services: '/services',
    blogs: '/blog',
  }[resource];

  return { path: `${prefix}/${updated.slug}` };
}

/**
 * Stores an override for a static page. Blank fields clear back to the code
 * default rather than persisting an empty string, so "reset" needs no separate
 * operation.
 */
export async function savePageSeo(
  path: string,
  values: PageSeoValues,
  actorId?: string,
): Promise<void> {
  await connectToDatabase();

  await SiteSetting.findOneAndUpdate(
    { key: pageSeoKey(path) },
    {
      key: pageSeoKey(path),
      value: {
        title: values.title.trim(),
        description: values.description.trim(),
        keywords: values.keywords,
      },
      group: 'seo',
      isPublic: false,
      ...(actorId ? { updatedBy: actorId } : {}),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}
