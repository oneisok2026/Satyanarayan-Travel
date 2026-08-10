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

export interface DestinationAttributes {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  type: PackageType;
  country: string;
  region?: string;
  shortDescription: string;
  description: string;
  coverImage: ImageAttributes;
  gallery: ImageAttributes[];
  bestTimeToVisit?: string;
  highlights: string[];
  featured: boolean;
  status: ContentStatus;
  sortOrder: number;
  seo?: SeoAttributes;
  createdAt: Date;
  updatedAt: Date;
}

const destinationSchema = new Schema<DestinationAttributes>(
  {
    name: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 160 },
    type: { type: String, enum: PACKAGE_TYPES, required: true },
    country: { type: String, required: true, trim: true, maxlength: 120 },
    region: { type: String, trim: true, maxlength: 120 },
    shortDescription: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, required: true, maxlength: 20000 },
    coverImage: { type: imageSchema, required: true },
    gallery: { type: [imageSchema], default: [] },
    bestTimeToVisit: { type: String, trim: true, maxlength: 200 },
    highlights: { type: [String], default: [] },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: CONTENT_STATUSES, default: 'draft' },
    sortOrder: { type: Number, default: 0 },
    seo: { type: seoSchema },
  },
  { timestamps: true, toJSON: baseToJSON },
);

// Public listing: published destinations, ordered.
destinationSchema.index({ status: 1, sortOrder: 1 });
// Homepage featured strip.
destinationSchema.index({ featured: 1, status: 1 });
// Domestic/international tabs.
destinationSchema.index({ type: 1, status: 1 });
// Admin search.
destinationSchema.index({ name: 'text', shortDescription: 'text' });

export type DestinationDocument = HydratedDocument<DestinationAttributes>;

export const Destination: Model<DestinationAttributes> =
  (models.Destination as Model<DestinationAttributes>) ??
  model<DestinationAttributes>('Destination', destinationSchema);
