import type { FormSection } from './CatalogueForm';
import { CONTENT_STATUSES, PACKAGE_TYPES } from '@/constants';

/**
 * Field definitions for the catalogue editors.
 *
 * Declared per resource rather than hand-built per page, so all five editors
 * stay consistent. These mirror the Zod write schemas — the server is the
 * authority and rejects anything not listed there.
 */

const statusOptions = CONTENT_STATUSES.map((status) => ({
  value: status,
  label:
    status === 'archived'
      ? 'Hidden'
      : status.replace(/^\w/, (c) => c.toUpperCase()),
}));

const typeOptions = PACKAGE_TYPES.map((type) => ({
  value: type,
  label: type.replace(/^\w/, (c) => c.toUpperCase()),
}));

const seoSection: FormSection = {
  title: 'Search engine listing',
  description:
    'Optional. Leave blank to fall back to the title and short description.',
  fields: [
    { name: 'seoTitle', path: 'seo.title', label: 'SEO title', kind: 'text', max: 70 },
    {
      name: 'seoDescription',
      path: 'seo.description',
      label: 'Meta description',
      kind: 'textarea',
      rows: 2,
      wide: true,
    },
  ],
};

export const PACKAGE_FIELDS: FormSection[] = [
  {
    title: 'Basics',
    fields: [
      { name: 'title', label: 'Package title', kind: 'text', required: true, wide: true },
      {
        name: 'slug',
        label: 'URL slug',
        kind: 'text',
        required: true,
        description: 'Lowercase words separated by hyphens. Changing this breaks existing links.',
      },
      { name: 'type', label: 'Type', kind: 'select', options: typeOptions, required: true },
      {
        name: 'shortDescription',
        label: 'Short description',
        kind: 'textarea',
        rows: 2,
        required: true,
        description: 'Shown on listing cards and in search results.',
        wide: true,
      },
      {
        name: 'description',
        label: 'Full description',
        kind: 'textarea',
        rows: 8,
        required: true,
        description: 'Separate paragraphs with a blank line.',
        wide: true,
      },
    ],
  },
  {
    title: 'Pricing and duration',
    fields: [
      { name: 'price', label: 'Price per person (INR)', kind: 'number', required: true, min: 0 },
      {
        name: 'compareAtPrice',
        label: 'Compare-at price (INR)',
        kind: 'number',
        min: 0,
        description: 'Optional. Shown struck through; must exceed the price.',
      },
      { name: 'childPrice', label: 'Child price (INR)', kind: 'number', min: 0 },
      { name: 'priceNote', label: 'Price note', kind: 'text', placeholder: 'per person on twin sharing' },
      { name: 'nights', path: 'duration.nights', label: 'Nights', kind: 'number', required: true, min: 0 },
      { name: 'days', path: 'duration.days', label: 'Days', kind: 'number', required: true, min: 1 },
    ],
  },
  {
    title: 'Cover image',
    fields: [
      {
        name: 'coverImageUrl',
        path: 'coverImage.url',
        label: 'Image',
        kind: 'image',
        required: true,
        description: 'Upload from your device, or paste a link.',
        wide: true,
      },
      {
        name: 'coverImageAlt',
        path: 'coverImage.alt',
        label: 'Alt text',
        kind: 'text',
        description: 'Describes the image for screen readers and search engines.',
        wide: true,
      },
    ],
  },
  {
    title: 'What is included',
    fields: [
      {
        name: 'inclusions',
        label: 'Inclusions',
        kind: 'list',
        rows: 6,
        description: 'One per line.',
      },
      {
        name: 'exclusions',
        label: 'Exclusions',
        kind: 'list',
        rows: 6,
        description: 'One per line.',
      },
      { name: 'transportation', label: 'Transportation', kind: 'textarea', rows: 2, wide: true },
      { name: 'brochureUrl', label: 'Brochure URL (PDF)', kind: 'url', wide: true },
    ],
  },
  {
    title: 'Visibility',
    fields: [
      { name: 'status', label: 'Status', kind: 'select', options: statusOptions, required: true },
      { name: 'featured', label: 'Show in featured packages', kind: 'checkbox' },
    ],
  },
  seoSection,
];

export const DESTINATION_FIELDS: FormSection[] = [
  {
    title: 'Basics',
    fields: [
      { name: 'name', label: 'Destination name', kind: 'text', required: true },
      { name: 'slug', label: 'URL slug', kind: 'text', required: true },
      { name: 'type', label: 'Type', kind: 'select', options: typeOptions, required: true },
      { name: 'country', label: 'Country', kind: 'text', required: true },
      { name: 'region', label: 'Region', kind: 'text' },
      { name: 'bestTimeToVisit', label: 'Best time to visit', kind: 'text' },
      {
        name: 'shortDescription',
        label: 'Short description',
        kind: 'textarea',
        rows: 2,
        required: true,
        wide: true,
      },
      {
        name: 'description',
        label: 'Full description',
        kind: 'textarea',
        rows: 8,
        required: true,
        wide: true,
      },
      {
        name: 'highlights',
        label: 'Highlights',
        kind: 'list',
        rows: 5,
        description: 'One per line.',
        wide: true,
      },
    ],
  },
  {
    title: 'Cover image',
    fields: [
      {
        name: 'coverImageUrl',
        path: 'coverImage.url',
        label: 'Image',
        kind: 'image',
        required: true,
        description: 'Upload from your device, or paste a link.',
        wide: true,
      },
      {
        name: 'coverImageAlt',
        path: 'coverImage.alt',
        label: 'Alt text',
        kind: 'text',
        wide: true,
      },
    ],
  },
  {
    title: 'Visibility',
    fields: [
      { name: 'status', label: 'Status', kind: 'select', options: statusOptions, required: true },
      { name: 'featured', label: 'Show in featured destinations', kind: 'checkbox' },
      { name: 'sortOrder', label: 'Sort order', kind: 'number', min: 0 },
    ],
  },
  seoSection,
];

export const CATEGORY_FIELDS: FormSection[] = [
  {
    title: 'Category',
    fields: [
      { name: 'name', label: 'Category name', kind: 'text', required: true },
      { name: 'slug', label: 'URL slug', kind: 'text', required: true },
      { name: 'description', label: 'Description', kind: 'textarea', rows: 3, wide: true },
      { name: 'icon', label: 'Icon key', kind: 'text' },
      { name: 'sortOrder', label: 'Sort order', kind: 'number', min: 0 },
      { name: 'status', label: 'Status', kind: 'select', options: statusOptions, required: true },
      { name: 'featured', label: 'Featured category', kind: 'checkbox' },
    ],
  },
];

export const SERVICE_FIELDS: FormSection[] = [
  {
    title: 'Service',
    fields: [
      { name: 'name', label: 'Service name', kind: 'text', required: true },
      { name: 'slug', label: 'URL slug', kind: 'text', required: true },
      {
        name: 'shortDescription',
        label: 'Short description',
        kind: 'textarea',
        rows: 2,
        required: true,
        wide: true,
      },
      {
        name: 'description',
        label: 'Full description',
        kind: 'textarea',
        rows: 8,
        required: true,
        wide: true,
      },
      {
        name: 'features',
        label: 'Features',
        kind: 'list',
        rows: 6,
        description: 'One per line.',
        wide: true,
      },
      { name: 'icon', label: 'Icon key', kind: 'text', description: 'hotel, car or ticket' },
      { name: 'sortOrder', label: 'Sort order', kind: 'number', min: 0 },
    ],
  },
  {
    title: 'Visibility',
    fields: [
      { name: 'status', label: 'Status', kind: 'select', options: statusOptions, required: true },
      { name: 'featured', label: 'Featured service', kind: 'checkbox' },
    ],
  },
  seoSection,
];

export const BLOG_FIELDS: FormSection[] = [
  {
    title: 'Article',
    fields: [
      { name: 'title', label: 'Title', kind: 'text', required: true, wide: true },
      { name: 'slug', label: 'URL slug', kind: 'text', required: true },
      { name: 'authorName', label: 'Author', kind: 'text', required: true },
      { name: 'category', label: 'Category', kind: 'text' },
      { name: 'readingMinutes', label: 'Reading time (minutes)', kind: 'number', min: 1 },
      {
        name: 'excerpt',
        label: 'Excerpt',
        kind: 'textarea',
        rows: 2,
        required: true,
        description: 'Shown on the blog listing and in search results.',
        wide: true,
      },
      {
        name: 'content',
        label: 'Content (HTML)',
        kind: 'textarea',
        rows: 16,
        required: true,
        description: 'Supports HTML: <h2>, <p>, <ul>, <strong> and links.',
        wide: true,
      },
      {
        name: 'tags',
        label: 'Tags',
        kind: 'list',
        rows: 3,
        description: 'One per line.',
        wide: true,
      },
    ],
  },
  {
    title: 'Cover image',
    fields: [
      {
        name: 'coverImageUrl',
        path: 'coverImage.url',
        label: 'Image',
        kind: 'image',
        required: true,
        description: 'Upload from your device, or paste a link.',
        wide: true,
      },
      {
        name: 'coverImageAlt',
        path: 'coverImage.alt',
        label: 'Alt text',
        kind: 'text',
        wide: true,
      },
    ],
  },
  {
    title: 'Visibility',
    fields: [
      { name: 'status', label: 'Status', kind: 'select', options: statusOptions, required: true },
    ],
  },
  seoSection,
];

export const GALLERY_FIELDS: FormSection[] = [
  {
    title: 'Image',
    fields: [
      {
        name: 'imageUrl',
        path: 'image.url',
        label: 'Image',
        kind: 'image',
        required: true,
        uploadFolder: 'gallery',
        description: 'Upload from your device, or paste a link.',
        wide: true,
      },
      {
        name: 'imageAlt',
        path: 'image.alt',
        label: 'Alt text',
        kind: 'text',
        description: 'Describes the image for screen readers and search engines.',
        wide: true,
      },
      {
        name: 'album',
        label: 'Album',
        kind: 'text',
        required: true,
        description: 'Images with the same album name are grouped together.',
      },
      { name: 'caption', label: 'Caption', kind: 'text' },
      { name: 'sortOrder', label: 'Sort order', kind: 'number', min: 0 },
      { name: 'status', label: 'Status', kind: 'select', options: statusOptions, required: true },
    ],
  },
];

export const HERO_SLIDE_FIELDS: FormSection[] = [
  {
    title: 'Image',
    fields: [
      {
        name: 'imageUrl',
        path: 'image.url',
        label: 'Background image',
        kind: 'image',
        required: true,
        uploadFolder: 'hero-slides',
        description: 'Wide, landscape photographs work best. Upload or paste a link.',
        wide: true,
      },
      {
        name: 'imageAlt',
        path: 'image.alt',
        label: 'Alt text',
        kind: 'text',
        description: 'Describes the image for screen readers and search engines.',
        wide: true,
      },
    ],
  },
  {
    title: 'Text',
    description: 'Shown centred over the image, and changes as the slide changes.',
    fields: [
      {
        name: 'eyebrow',
        label: 'Eyebrow',
        kind: 'text',
        placeholder: 'Handcrafted journeys since 2009',
        description: 'Small label above the headline. Optional.',
        wide: true,
      },
      { name: 'headline', label: 'Headline', kind: 'text', required: true, wide: true },
      {
        name: 'headlineAccent',
        label: 'Headline (accent line)',
        kind: 'text',
        description: 'Optional second line, shown in the accent colour.',
        wide: true,
      },
      {
        name: 'subheadline',
        label: 'Subheadline',
        kind: 'textarea',
        rows: 3,
        description: 'One or two sentences under the headline. Optional.',
        wide: true,
      },
    ],
  },
  {
    title: 'Buttons',
    description: 'Each button needs both a label and a link, or leave both blank.',
    fields: [
      { name: 'ctaLabel', label: 'Primary button label', kind: 'text' },
      {
        name: 'ctaHref',
        label: 'Primary button link',
        kind: 'text',
        placeholder: '/tours',
      },
      { name: 'secondaryCtaLabel', label: 'Secondary button label', kind: 'text' },
      {
        name: 'secondaryCtaHref',
        label: 'Secondary button link',
        kind: 'text',
        placeholder: '/contact',
      },
    ],
  },
  {
    title: 'Visibility',
    fields: [
      { name: 'status', label: 'Status', kind: 'select', options: statusOptions, required: true },
      {
        name: 'sortOrder',
        label: 'Sort order',
        kind: 'number',
        min: 0,
        description: 'Lower numbers appear first.',
      },
    ],
  },
];

export const FIELDS_BY_RESOURCE = {
  packages: PACKAGE_FIELDS,
  destinations: DESTINATION_FIELDS,
  categories: CATEGORY_FIELDS,
  services: SERVICE_FIELDS,
  blogs: BLOG_FIELDS,
  gallery: GALLERY_FIELDS,
  'hero-slides': HERO_SLIDE_FIELDS,
} as const;
