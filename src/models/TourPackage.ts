import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type Model,
  type Types,
} from 'mongoose';
import { CONTENT_STATUSES, PACKAGE_TYPES, type ContentStatus, type PackageType } from '@/constants';
import { imageSchema, seoSchema, baseToJSON, type ImageAttributes, type SeoAttributes } from './shared';

export interface ItineraryDayAttributes {
  day: number;
  title: string;
  description: string;
  meals: string[];
  accommodation?: string;
  activities: string[];
  image?: ImageAttributes;
}

export interface HotelAttributes {
  city: string;
  name: string;
  category: string;
  nights: number;
  roomType?: string;
}

export interface JourneyDateAttributes {
  startDate: Date;
  endDate: Date;
  seatsAvailable?: number;
  priceOverride?: number;
}

export interface TourPackageAttributes {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  type: PackageType;
  destinationIds: Types.ObjectId[];
  categoryId?: Types.ObjectId;
  shortDescription: string;
  description: string;
  coverImage: ImageAttributes;
  gallery: ImageAttributes[];
  duration: { nights: number; days: number };
  journeyDates: JourneyDateAttributes[];
  price: number;
  compareAtPrice?: number;
  childPrice?: number;
  priceNote?: string;
  /**
   * Hides every price on the public site and shows the enquiry message
   * instead. The stored figures are kept so booking and reporting still have
   * a number to work from once the agency quotes the trip.
   *
   * Defaults to true: the agency quotes each trip rather than selling at a
   * list price, so a package must not publish a figure unless someone has
   * deliberately chosen to show it.
   */
  priceOnRequest: boolean;
  itinerary: ItineraryDayAttributes[];
  inclusions: string[];
  exclusions: string[];
  hotels: HotelAttributes[];
  transportation?: string;
  brochureUrl?: string;
  featured: boolean;
  status: ContentStatus;
  seo?: SeoAttributes;
  /** Denormalized from approved reviews so listings avoid a join. */
  rating: { average: number; count: number };
  createdAt: Date;
  updatedAt: Date;
}

const itinerarySchema = new Schema<ItineraryDayAttributes>(
  {
    day: { type: Number, required: true, min: 1 },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 5000 },
    meals: { type: [String], default: [] },
    accommodation: { type: String, trim: true, maxlength: 200 },
    activities: { type: [String], default: [] },
    image: { type: imageSchema },
  },
  { _id: false },
);

const hotelSchema = new Schema<HotelAttributes>(
  {
    city: { type: String, required: true, trim: true, maxlength: 120 },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    category: { type: String, required: true, trim: true, maxlength: 60 },
    nights: { type: Number, required: true, min: 0 },
    roomType: { type: String, trim: true, maxlength: 120 },
  },
  { _id: false },
);

const journeyDateSchema = new Schema<JourneyDateAttributes>(
  {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    seatsAvailable: { type: Number, min: 0 },
    priceOverride: { type: Number, min: 0 },
  },
  { _id: false },
);

const tourPackageSchema = new Schema<TourPackageAttributes>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 220 },
    type: { type: String, enum: PACKAGE_TYPES, required: true },
    destinationIds: { type: [Schema.Types.ObjectId], ref: 'Destination', default: [] },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    shortDescription: { type: String, required: true, trim: true, maxlength: 400 },
    description: { type: String, required: true, maxlength: 30000 },
    coverImage: { type: imageSchema, required: true },
    gallery: { type: [imageSchema], default: [] },
    duration: {
      nights: { type: Number, required: true, min: 0 },
      days: { type: Number, required: true, min: 1 },
    },
    journeyDates: { type: [journeyDateSchema], default: [] },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    childPrice: { type: Number, min: 0 },
    priceNote: { type: String, trim: true, maxlength: 200 },
    priceOnRequest: { type: Boolean, default: true },
    itinerary: { type: [itinerarySchema], default: [] },
    inclusions: { type: [String], default: [] },
    exclusions: { type: [String], default: [] },
    hotels: { type: [hotelSchema], default: [] },
    transportation: { type: String, trim: true, maxlength: 2000 },
    brochureUrl: { type: String, trim: true, maxlength: 1024 },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: CONTENT_STATUSES, default: 'draft' },
    seo: { type: seoSchema },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },
  },
  { timestamps: true, toJSON: baseToJSON },
);

// Indexes mirror the actual query shapes used by the listing pages.
tourPackageSchema.index({ status: 1, createdAt: -1 });
tourPackageSchema.index({ type: 1, status: 1, createdAt: -1 });
tourPackageSchema.index({ featured: 1, status: 1 });
tourPackageSchema.index({ destinationIds: 1, status: 1 });
tourPackageSchema.index({ categoryId: 1, status: 1 });
// Price-sorted filtering within a type.
tourPackageSchema.index({ status: 1, price: 1 });
// Keyword search across listing fields.
tourPackageSchema.index({ title: 'text', shortDescription: 'text' });

export type TourPackageDocument = HydratedDocument<TourPackageAttributes>;

export const TourPackage: Model<TourPackageAttributes> =
  (models.TourPackage as Model<TourPackageAttributes>) ??
  model<TourPackageAttributes>('TourPackage', tourPackageSchema);
