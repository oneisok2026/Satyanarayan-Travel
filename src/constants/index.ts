/** Application-wide enumerations and constants. Single source of truth. */

export const USER_ROLES = ['customer', 'admin', 'super_admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ['active', 'suspended', 'deleted'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const PACKAGE_TYPES = ['domestic', 'international'] as const;
export type PackageType = (typeof PACKAGE_TYPES)[number];

export const CONTENT_STATUSES = ['draft', 'published', 'archived'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const ENQUIRY_STATUSES = [
  'new',
  'contacted',
  'follow_up',
  'quoted',
  'confirmed',
  'closed',
] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export const ENQUIRY_TYPES = [
  'general',
  'package',
  'hotel',
  'car_rental',
  'eticket',
  'contact',
] as const;
export type EnquiryType = (typeof ENQUIRY_TYPES)[number];

export const BOOKING_STATUSES = [
  'requested',
  'pending_confirmation',
  'confirmed',
  'cancelled',
  'completed',
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const PAYMENT_STATUSES = [
  'unpaid',
  'pending',
  'paid',
  'failed',
  'refunded',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const REVIEW_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const SERVICE_SLUGS = [
  'hotel-booking',
  'car-rental',
  'e-ticket-booking',
] as const;
export type ServiceSlug = (typeof SERVICE_SLUGS)[number];

/** Roles permitted into the admin area. */
export const ADMIN_ROLES: readonly UserRole[] = ['admin', 'super_admin'];

/** Pagination defaults, enforced server-side so a client cannot request 10k rows. */
export const PAGINATION = {
  defaultPage: 1,
  defaultLimit: 12,
  maxLimit: 60,
} as const;

/** Upload constraints, enforced on the server for every file. */
export const UPLOAD_LIMITS = {
  maxImageBytes: 5 * 1024 * 1024, // 5 MB
  maxDocumentBytes: 10 * 1024 * 1024, // 10 MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const,
  allowedDocumentTypes: ['application/pdf'] as const,
} as const;

/**
 * Storage folders an upload may target.
 *
 * A closed list, because the folder becomes part of the object path. Anything
 * outside it is rejected rather than sanitized, so a crafted value cannot
 * write into an unexpected prefix.
 */
export const UPLOAD_FOLDERS = [
  'packages',
  'destinations',
  'blogs',
  'services',
  'categories',
  'gallery',
  'hero-slides',
  'settings',
] as const;

export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

/** Rate limits per window, keyed by logical bucket. */
export const RATE_LIMITS = {
  enquiry: { limit: 5, windowMs: 10 * 60 * 1000 },
  booking: { limit: 5, windowMs: 10 * 60 * 1000 },
  review: { limit: 3, windowMs: 60 * 60 * 1000 },
  session: { limit: 20, windowMs: 10 * 60 * 1000 },
  /**
   * Failed sign-in attempts per IP. Deliberately tight: /admin/login is
   * public, so it attracts automated credential stuffing, and this is the
   * control that holds when an account password is weak.
   */
  loginAttempt: { limit: 8, windowMs: 15 * 60 * 1000 },
  contact: { limit: 5, windowMs: 10 * 60 * 1000 },
  /**
   * Media uploads per admin. Generous enough to fill a gallery in one sitting,
   * tight enough that a stolen session cannot be used to fill the bucket.
   */
  upload: { limit: 40, windowMs: 10 * 60 * 1000 },
  default: { limit: 60, windowMs: 60 * 1000 },
} as const;

export type RateLimitBucket = keyof typeof RATE_LIMITS;

/** Revalidation windows (seconds) for cacheable public content. */
export const REVALIDATE = {
  home: 600,
  packages: 300,
  packageDetail: 300,
  destinations: 900,
  blog: 600,
  gallery: 900,
  services: 3600,
  staticPage: 86400,
} as const;
