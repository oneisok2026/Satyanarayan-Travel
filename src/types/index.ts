import type {
  BookingStatus,
  ContentStatus,
  EnquiryStatus,
  EnquiryType,
  PackageType,
  PaymentStatus,
  UserRole,
  UserStatus,
} from '@/constants';

/**
 * Serialized DTOs.
 *
 * These are the shapes crossing the network — plain JSON with ObjectIds as
 * strings and Dates as ISO strings. Mongoose documents never leave the server
 * as-is; services map them to these types.
 */

export interface SessionUser {
  id: string;
  firebaseUid: string;
  email: string;
  name: string;
  phone?: string;
  photoURL?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
}

export interface UserProfileDTO extends SessionUser {
  profile: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    dateOfBirth?: string;
    passportNumber?: string;
  };
  preferences: {
    marketingEmails: boolean;
    whatsappUpdates: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SeoDTO {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
}

export interface ImageDTO {
  url: string;
  alt: string;
  width?: number;
  height?: number;
  caption?: string;
}

export interface DestinationDTO {
  id: string;
  name: string;
  slug: string;
  type: PackageType;
  country: string;
  region?: string;
  shortDescription: string;
  description: string;
  coverImage: ImageDTO;
  gallery: ImageDTO[];
  bestTimeToVisit?: string;
  highlights: string[];
  featured: boolean;
  status: ContentStatus;
  sortOrder: number;
  seo?: SeoDTO;
  packageCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  featured: boolean;
  status: ContentStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ItineraryDayDTO {
  day: number;
  title: string;
  description: string;
  meals: string[];
  accommodation?: string;
  activities: string[];
  image?: ImageDTO;
}

export interface HotelDTO {
  city: string;
  name: string;
  category: string;
  nights: number;
  roomType?: string;
}

export interface JourneyDateDTO {
  startDate: string;
  endDate: string;
  seatsAvailable?: number;
  priceOverride?: number;
}

export interface TourPackageDTO {
  id: string;
  title: string;
  slug: string;
  type: PackageType;
  destinations: Pick<DestinationDTO, 'id' | 'name' | 'slug'>[];
  category?: Pick<CategoryDTO, 'id' | 'name' | 'slug'>;
  shortDescription: string;
  description: string;
  coverImage: ImageDTO;
  gallery: ImageDTO[];
  duration: { nights: number; days: number };
  journeyDates: JourneyDateDTO[];
  price: number;
  priceNote?: string;
  /** Struck-through original price, when the package is discounted. */
  compareAtPrice?: number;
  itinerary: ItineraryDayDTO[];
  inclusions: string[];
  exclusions: string[];
  hotels: HotelDTO[];
  transportation?: string;
  brochureUrl?: string;
  featured: boolean;
  status: ContentStatus;
  seo?: SeoDTO;
  rating: { average: number; count: number };
  createdAt: string;
  updatedAt: string;
}

/** Trimmed shape for listing grids — avoids shipping itineraries to a list page. */
export interface TourPackageSummaryDTO {
  id: string;
  title: string;
  slug: string;
  type: PackageType;
  destinations: Pick<DestinationDTO, 'id' | 'name' | 'slug'>[];
  category?: Pick<CategoryDTO, 'id' | 'name' | 'slug'>;
  shortDescription: string;
  coverImage: ImageDTO;
  duration: { nights: number; days: number };
  price: number;
  compareAtPrice?: number;
  priceNote?: string;
  featured: boolean;
  rating: { average: number; count: number };
}

export interface EnquiryDTO {
  id: string;
  type: EnquiryType;
  referenceCode: string;
  name: string;
  email: string;
  phone: string;
  packageRef?: Pick<TourPackageDTO, 'id' | 'title' | 'slug'>;
  destinationRef?: Pick<DestinationDTO, 'id' | 'name' | 'slug'>;
  serviceSlug?: string;
  travelDate?: string;
  travellers: { adults: number; children: number };
  budget?: number;
  message?: string;
  status: EnquiryStatus;
  /** Set the first time an admin opened it; absent means unread. */
  readAt?: string;
  serviceDetails?: Record<string, string | number | boolean>;
  createdAt: string;
  updatedAt: string;
}

export interface TravellerDTO {
  name: string;
  age: number;
  gender?: 'male' | 'female' | 'other';
}

export interface BookingDTO {
  id: string;
  bookingReference: string;
  packageRef: Pick<TourPackageDTO, 'id' | 'title' | 'slug' | 'coverImage'>;
  travelDate: string;
  travellers: TravellerDTO[];
  pricingSnapshot: {
    unitPrice: number;
    adults: number;
    children: number;
    childPrice: number;
    subtotal: number;
    taxes: number;
    total: number;
    currency: string;
  };
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  contact: { name: string; email: string; phone: string };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPostDTO {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: ImageDTO;
  category?: string;
  tags: string[];
  author: { name: string; photoURL?: string };
  readingMinutes: number;
  status: ContentStatus;
  publishedAt?: string;
  seo?: SeoDTO;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryItemDTO {
  id: string;
  album: string;
  albumSlug: string;
  image: ImageDTO;
  caption?: string;
  sortOrder: number;
  status: ContentStatus;
  createdAt: string;
}

export interface ServiceDTO {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  icon?: string;
  coverImage?: ImageDTO;
  showcaseImage?: ImageDTO;
  features: string[];
  featured: boolean;
  status: ContentStatus;
  sortOrder: number;
  seo?: SeoDTO;
}

export interface FavouriteDTO {
  id: string;
  package: TourPackageSummaryDTO;
  createdAt: string;
}

export interface AdminStatsDTO {
  customers: { total: number; newThisMonth: number };
  packages: { total: number; published: number; featured: number };
  enquiries: { total: number; pending: number; thisMonth: number };
  bookings: { total: number; pending: number; confirmed: number; thisMonth: number };
  revenue: { confirmedTotal: number; currency: string };
}

export interface ActivityItemDTO {
  id: string;
  type: 'enquiry' | 'booking' | 'customer';
  title: string;
  subtitle: string;
  status?: string;
  href: string;
  createdAt: string;
}

/** Mirrors the API envelope from system-architecture.md §15. */
export type ApiResult<T> =
  | {
      success: true;
      data: T;
      message: string;
      meta?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }
  | {
      success: false;
      error: { code: string; message: string; fields?: Record<string, string[]> };
    };
