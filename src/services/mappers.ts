import 'server-only';

import type { Types } from 'mongoose';
import type {
  BlogPostDTO,
  BookingDTO,
  CategoryDTO,
  DestinationDTO,
  EnquiryDTO,
  GalleryItemDTO,
  ImageDTO,
  ReviewDTO,
  ServiceDTO,
  TourPackageDTO,
  TourPackageSummaryDTO,
} from '@/types';

/**
 * Lean document → DTO mappers.
 *
 * Everything crossing the network passes through here, which guarantees two
 * things: ObjectIds and Dates are serialized as strings, and `select:false`
 * fields (passportNumber, adminNotes, ipHash) cannot leak by being spread
 * into a response.
 */

/**
 * Mapper input.
 *
 * `.lean()` returns a precisely-typed document with no index signature, while
 * `.toObject()` returns a plain object. `MapperInput` accepts either; the
 * `Lean` alias used inside the mappers is the indexable view of it.
 *
 * Every field is read through a narrowing helper below, so the loose internal
 * type never reaches a DTO — the DTOs stay fully typed.
 */
export type MapperInput = object;

type Lean = Record<string, unknown>;

/** Widens a typed lean document to an indexable record for field access. */
const asLean = (input: MapperInput): Lean => input as Lean;

const str = (value: unknown): string =>
  value == null ? '' : String(value as string | Types.ObjectId);

const iso = (value: unknown): string =>
  value instanceof Date ? value.toISOString() : String(value ?? '');

const isoOptional = (value: unknown): string | undefined =>
  value instanceof Date ? value.toISOString() : undefined;

function image(value: unknown): ImageDTO {
  const source = (value ?? {}) as Lean;
  return {
    url: str(source.url),
    alt: str(source.alt),
    width: source.width as number | undefined,
    height: source.height as number | undefined,
    caption: source.caption as string | undefined,
  };
}

function images(value: unknown): ImageDTO[] {
  return Array.isArray(value) ? value.map(image) : [];
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

/** Populated ref → {id,name,slug}; unpopulated ObjectId → skipped. */
function refNameSlug(
  value: unknown,
): { id: string; name: string; slug: string } | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const source = value as Lean;
  if (!source.slug) return undefined;
  return { id: str(source._id), name: str(source.name), slug: str(source.slug) };
}

function refList(value: unknown): { id: string; name: string; slug: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(refNameSlug)
    .filter((item): item is { id: string; name: string; slug: string } => item != null);
}

function seo(value: unknown) {
  if (!value || typeof value !== 'object') return undefined;
  const source = value as Lean;
  return {
    title: source.title as string | undefined,
    description: source.description as string | undefined,
    keywords: Array.isArray(source.keywords) ? strings(source.keywords) : undefined,
    ogImage: source.ogImage as string | undefined,
  };
}

// ------------------------------------------------------------- destination --

export function toDestinationDTO(input: MapperInput): DestinationDTO {
  const document = asLean(input);
  return {
    id: str(document._id),
    name: str(document.name),
    slug: str(document.slug),
    type: document.type as DestinationDTO['type'],
    country: str(document.country),
    region: document.region as string | undefined,
    shortDescription: str(document.shortDescription),
    description: str(document.description),
    coverImage: image(document.coverImage),
    gallery: images(document.gallery),
    bestTimeToVisit: document.bestTimeToVisit as string | undefined,
    highlights: strings(document.highlights),
    featured: Boolean(document.featured),
    status: document.status as DestinationDTO['status'],
    sortOrder: (document.sortOrder as number) ?? 0,
    seo: seo(document.seo),
    packageCount: document.packageCount as number | undefined,
    createdAt: iso(document.createdAt),
    updatedAt: iso(document.updatedAt),
  };
}

export function toCategoryDTO(input: MapperInput): CategoryDTO {
  const document = asLean(input);
  return {
    id: str(document._id),
    name: str(document.name),
    slug: str(document.slug),
    description: document.description as string | undefined,
    icon: document.icon as string | undefined,
    featured: Boolean(document.featured),
    status: document.status as CategoryDTO['status'],
    sortOrder: (document.sortOrder as number) ?? 0,
    createdAt: iso(document.createdAt),
    updatedAt: iso(document.updatedAt),
  };
}

// ----------------------------------------------------------------- package --

export function toPackageSummaryDTO(input: MapperInput): TourPackageSummaryDTO {
  const document = asLean(input);
  const duration = (document.duration ?? {}) as Lean;
  const rating = (document.rating ?? {}) as Lean;

  return {
    id: str(document._id),
    title: str(document.title),
    slug: str(document.slug),
    type: document.type as TourPackageSummaryDTO['type'],
    destinations: refList(document.destinationIds),
    category: refNameSlug(document.categoryId),
    shortDescription: str(document.shortDescription),
    coverImage: image(document.coverImage),
    duration: {
      nights: (duration.nights as number) ?? 0,
      days: (duration.days as number) ?? 0,
    },
    price: (document.price as number) ?? 0,
    compareAtPrice: document.compareAtPrice as number | undefined,
    priceNote: document.priceNote as string | undefined,
    featured: Boolean(document.featured),
    rating: {
      average: (rating.average as number) ?? 0,
      count: (rating.count as number) ?? 0,
    },
  };
}

export function toPackageDTO(input: MapperInput): TourPackageDTO {
  const document = asLean(input);
  const summary = toPackageSummaryDTO(document);

  return {
    ...summary,
    description: str(document.description),
    gallery: images(document.gallery),
    journeyDates: Array.isArray(document.journeyDates)
      ? document.journeyDates.map((entry) => {
          const source = entry as Lean;
          return {
            startDate: iso(source.startDate),
            endDate: iso(source.endDate),
            seatsAvailable: source.seatsAvailable as number | undefined,
            priceOverride: source.priceOverride as number | undefined,
          };
        })
      : [],
    itinerary: Array.isArray(document.itinerary)
      ? document.itinerary.map((entry) => {
          const source = entry as Lean;
          return {
            day: (source.day as number) ?? 0,
            title: str(source.title),
            description: str(source.description),
            meals: strings(source.meals),
            accommodation: source.accommodation as string | undefined,
            activities: strings(source.activities),
            image: source.image ? image(source.image) : undefined,
          };
        })
      : [],
    inclusions: strings(document.inclusions),
    exclusions: strings(document.exclusions),
    hotels: Array.isArray(document.hotels)
      ? document.hotels.map((entry) => {
          const source = entry as Lean;
          return {
            city: str(source.city),
            name: str(source.name),
            category: str(source.category),
            nights: (source.nights as number) ?? 0,
            roomType: source.roomType as string | undefined,
          };
        })
      : [],
    transportation: document.transportation as string | undefined,
    brochureUrl: document.brochureUrl as string | undefined,
    status: document.status as TourPackageDTO['status'],
    seo: seo(document.seo),
    createdAt: iso(document.createdAt),
    updatedAt: iso(document.updatedAt),
  };
}

// ----------------------------------------------------------------- enquiry --

export function toEnquiryDTO(input: MapperInput): EnquiryDTO {
  const document = asLean(input);
  const travellers = (document.travellers ?? {}) as Lean;
  const pkg = document.packageId as Lean | undefined;
  const destination = document.destinationId as Lean | undefined;

  return {
    id: str(document._id),
    type: document.type as EnquiryDTO['type'],
    referenceCode: str(document.referenceCode),
    name: str(document.name),
    email: str(document.email),
    phone: str(document.phone),
    packageRef:
      pkg && typeof pkg === 'object' && pkg.slug
        ? { id: str(pkg._id), title: str(pkg.title), slug: str(pkg.slug) }
        : undefined,
    destinationRef: refNameSlug(destination),
    serviceSlug: document.serviceSlug as string | undefined,
    travelDate: isoOptional(document.travelDate),
    travellers: {
      adults: (travellers.adults as number) ?? 1,
      children: (travellers.children as number) ?? 0,
    },
    budget: document.budget as number | undefined,
    message: document.message as string | undefined,
    status: document.status as EnquiryDTO['status'],
    serviceDetails: document.serviceDetails as EnquiryDTO['serviceDetails'],
    createdAt: iso(document.createdAt),
    updatedAt: iso(document.updatedAt),
    // internalNotes and ipHash are intentionally never mapped for customers.
  };
}

// ----------------------------------------------------------------- booking --

export function toBookingDTO(input: MapperInput): BookingDTO {
  const document = asLean(input);
  const pricing = (document.pricingSnapshot ?? {}) as Lean;
  const contact = (document.contact ?? {}) as Lean;
  const pkg = document.packageId as Lean | undefined;

  return {
    id: str(document._id),
    bookingReference: str(document.bookingReference),
    packageRef: {
      id: pkg && typeof pkg === 'object' ? str(pkg._id) : str(document.packageId),
      title: str(pkg?.title ?? document.packageTitle),
      slug: str(pkg?.slug ?? document.packageSlug),
      coverImage: image(pkg?.coverImage),
    },
    travelDate: iso(document.travelDate),
    travellers: Array.isArray(document.travellers)
      ? document.travellers.map((entry) => {
          const source = entry as Lean;
          return {
            name: str(source.name),
            age: (source.age as number) ?? 0,
            gender: source.gender as 'male' | 'female' | 'other' | undefined,
          };
        })
      : [],
    pricingSnapshot: {
      unitPrice: (pricing.unitPrice as number) ?? 0,
      adults: (pricing.adults as number) ?? 0,
      children: (pricing.children as number) ?? 0,
      childPrice: (pricing.childPrice as number) ?? 0,
      subtotal: (pricing.subtotal as number) ?? 0,
      taxes: (pricing.taxes as number) ?? 0,
      total: (pricing.total as number) ?? 0,
      currency: str(pricing.currency) || 'INR',
    },
    status: document.status as BookingDTO['status'],
    paymentStatus: document.paymentStatus as BookingDTO['paymentStatus'],
    contact: {
      name: str(contact.name),
      email: str(contact.email),
      phone: str(contact.phone),
    },
    notes: document.notes as string | undefined,
    createdAt: iso(document.createdAt),
    updatedAt: iso(document.updatedAt),
    // adminNotes is select:false and never mapped here.
  };
}

// ------------------------------------------------------------------ review --

export function toReviewDTO(input: MapperInput): ReviewDTO {
  const document = asLean(input);
  const pkg = document.packageId as Lean | undefined;

  return {
    id: str(document._id),
    packageRef:
      pkg && typeof pkg === 'object' && pkg.slug
        ? { id: str(pkg._id), title: str(pkg.title), slug: str(pkg.slug) }
        : undefined,
    authorName: str(document.authorName),
    authorPhoto: document.authorPhoto as string | undefined,
    rating: (document.rating as number) ?? 0,
    title: document.title as string | undefined,
    comment: str(document.comment),
    status: document.status as ReviewDTO['status'],
    travelDate: isoOptional(document.travelDate),
    createdAt: iso(document.createdAt),
  };
}

// -------------------------------------------------------------------- blog --

export function toBlogPostDTO(input: MapperInput): BlogPostDTO {
  const document = asLean(input);
  return {
    id: str(document._id),
    title: str(document.title),
    slug: str(document.slug),
    excerpt: str(document.excerpt),
    content: str(document.content),
    coverImage: image(document.coverImage),
    category: document.category as string | undefined,
    tags: strings(document.tags),
    author: {
      name: str(document.authorName),
      photoURL: document.authorPhoto as string | undefined,
    },
    readingMinutes: (document.readingMinutes as number) ?? 3,
    status: document.status as BlogPostDTO['status'],
    publishedAt: isoOptional(document.publishedAt),
    seo: seo(document.seo),
    createdAt: iso(document.createdAt),
    updatedAt: iso(document.updatedAt),
  };
}

/** Listing variant: omits the article body. */
export function toBlogSummaryDTO(input: MapperInput): Omit<BlogPostDTO, 'content'> {
  const document = asLean(input);
  const full = toBlogPostDTO(document);
  const { content: _content, ...summary } = full;
  return summary;
}

// ----------------------------------------------------------------- gallery --

export function toGalleryItemDTO(input: MapperInput): GalleryItemDTO {
  const document = asLean(input);
  return {
    id: str(document._id),
    album: str(document.album),
    albumSlug: str(document.albumSlug),
    image: image(document.image),
    caption: document.caption as string | undefined,
    sortOrder: (document.sortOrder as number) ?? 0,
    status: document.status as GalleryItemDTO['status'],
    createdAt: iso(document.createdAt),
  };
}

// ----------------------------------------------------------------- service --

export function toServiceDTO(input: MapperInput): ServiceDTO {
  const document = asLean(input);
  return {
    id: str(document._id),
    name: str(document.name),
    slug: str(document.slug),
    shortDescription: str(document.shortDescription),
    description: str(document.description),
    icon: document.icon as string | undefined,
    coverImage: document.coverImage ? image(document.coverImage) : undefined,
    showcaseImage: document.showcaseImage ? image(document.showcaseImage) : undefined,
    features: strings(document.features),
    featured: Boolean(document.featured),
    status: document.status as ServiceDTO['status'],
    sortOrder: (document.sortOrder as number) ?? 0,
    seo: seo(document.seo),
  };
}
