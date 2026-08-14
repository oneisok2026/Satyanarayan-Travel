import type { FormSection } from './CatalogueForm';
import {
  CONTACT_DETAIL_KINDS,
  CONTACT_DETAIL_KIND_LABELS,
  CONTACT_PLACEMENTS,
  CONTACT_PLACEMENT_LABELS,
  CONTENT_STATUSES,
  PACKAGE_TYPES,
  SOCIAL_PLATFORMS,
  SOCIAL_PLATFORM_LABELS,
} from '@/constants';

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
    {
      name: 'seoKeywords',
      path: 'seo.keywords',
      label: 'Meta keywords',
      kind: 'tags',
      placeholder: 'kashmir tour, dal lake houseboat, gulmarg package',
      description:
        'Separate with commas. Up to 20 terms. Most search engines ignore these, so treat the title and description above as the ones that matter.',
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
    title: 'Duration',
    fields: [
      { name: 'nights', path: 'duration.nights', label: 'Nights', kind: 'number', required: true, min: 0 },
      { name: 'days', path: 'duration.days', label: 'Days', kind: 'number', required: true, min: 1 },
    ],
  },
  {
    title: 'Pricing',
    description:
      'These figures are used internally — to price a booking when one is placed, and for the revenue totals on the dashboard. They are required even when the price is hidden from visitors, which it is by default.',
    fields: [
      {
        name: 'priceOnRequest',
        label: 'Hide the price on the website',
        kind: 'checkbox',
        description:
          'On by default: visitors see the enquiry message instead of a figure. Untick it only to publish this package at a fixed public price.',
        wide: true,
      },
      { name: 'price', label: 'Price per person (INR)', kind: 'number', required: true, min: 0 },
      { name: 'childPrice', label: 'Child price (INR)', kind: 'number', min: 0 },
      {
        name: 'compareAtPrice',
        label: 'Compare-at price (INR)',
        kind: 'number',
        min: 0,
        description:
          'Optional, and only visible when the price is shown. Struck through; must exceed the price.',
      },
      {
        name: 'priceNote',
        label: 'Price note',
        kind: 'text',
        placeholder: 'per person on twin sharing',
        description: 'Only visible when the price is shown.',
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
        description: 'Describes the image for screen readers and search engines.',
        wide: true,
      },
    ],
  },
  {
    title: 'Day-wise itinerary',
    description:
      'Shown as the expandable day-by-day plan on the package page. Leave empty to hide that section.',
    fields: [
      {
        name: 'itinerary',
        label: 'Days',
        kind: 'itinerary',
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
    title: 'Banner image',
    description: 'Background of the page header. Optional — a default is used when empty.',
    fields: [
      {
        name: 'coverImageUrl',
        path: 'coverImage.url',
        label: 'Image',
        kind: 'image',
        uploadFolder: 'services',
        description: 'Upload from your device, or paste a link. Clear the field to remove it.',
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
    title: 'Showcase image',
    description:
      'Shown in the page body, below the service description. Leave empty to hide it.',
    fields: [
      {
        name: 'showcaseImageUrl',
        path: 'showcaseImage.url',
        label: 'Image',
        kind: 'image',
        uploadFolder: 'services',
        description: 'Upload from your device, or paste a link. Clear the field to remove it.',
        wide: true,
      },
      {
        name: 'showcaseImageAlt',
        path: 'showcaseImage.alt',
        label: 'Alt text',
        kind: 'text',
        description: 'Describes the image for screen readers and search engines.',
        wide: true,
      },
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

export const SOCIAL_LINK_FIELDS: FormSection[] = [
  {
    title: 'Social profile',
    description: 'Shown as an icon on the right of the top bar.',
    fields: [
      {
        name: 'platform',
        label: 'Platform',
        kind: 'select',
        required: true,
        options: SOCIAL_PLATFORMS.map((platform) => ({
          value: platform,
          label: SOCIAL_PLATFORM_LABELS[platform],
        })),
        description: 'Chooses which icon is shown.',
      },
      {
        name: 'url',
        label: 'Profile link',
        kind: 'url',
        required: true,
        placeholder: 'https://facebook.com/yourpage',
        description: 'The full address, including https://',
        wide: true,
      },
      {
        name: 'label',
        label: 'Accessible name',
        kind: 'text',
        description: 'Read by screen readers. Defaults to the platform name.',
        wide: true,
      },
      {
        name: 'sortOrder',
        label: 'Sort order',
        kind: 'number',
        min: 0,
        description: 'Lower numbers appear first.',
      },
      { name: 'status', label: 'Status', kind: 'select', options: statusOptions, required: true },
    ],
  },
];

export const CONTACT_DETAIL_FIELDS: FormSection[] = [
  {
    title: 'Contact detail',
    description:
      'Phone numbers and email addresses shown in the top bar, the footer and on the contact page.',
    fields: [
      {
        name: 'kind',
        label: 'Type',
        kind: 'select',
        required: true,
        options: CONTACT_DETAIL_KINDS.map((kind) => ({
          value: kind,
          label: CONTACT_DETAIL_KIND_LABELS[kind],
        })),
        description: 'Decides whether this becomes a call, email or WhatsApp link.',
      },
      {
        name: 'value',
        label: 'Number or address',
        kind: 'text',
        required: true,
        placeholder: '+91 89101 02904',
        description:
          'Type it exactly as it should appear. The dialling link is generated from it.',
        wide: true,
      },
      {
        name: 'label',
        label: 'Caption',
        kind: 'text',
        placeholder: 'Sales, Bookings, Alternate line',
        description: 'Optional small text shown above the number. ',
        wide: true,
      },
      {
        name: 'placement',
        label: 'Show in',
        kind: 'select',
        required: true,
        options: CONTACT_PLACEMENTS.map((placement) => ({
          value: placement,
          label: CONTACT_PLACEMENT_LABELS[placement],
        })),
      },
      {
        name: 'isPrimary',
        label: 'Use as the main line of its type',
        kind: 'checkbox',
        description:
          'The top bar and the WhatsApp button have room for one number and one address — this picks which. Without it, the lowest sort order is used.',
        wide: true,
      },
      {
        name: 'sortOrder',
        label: 'Sort order',
        kind: 'number',
        min: 0,
        description: 'Lower numbers appear first.',
      },
      {
        name: 'status',
        label: 'Status',
        kind: 'select',
        options: statusOptions,
        required: true,
        description: 'Hidden entries stay saved but disappear from the website.',
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
  'social-links': SOCIAL_LINK_FIELDS,
  'contact-details': CONTACT_DETAIL_FIELDS,
} as const;
