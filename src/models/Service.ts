import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type Model,
  type Types,
} from 'mongoose';
import { CONTENT_STATUSES, type ContentStatus } from '@/constants';
import { imageSchema, seoSchema, baseToJSON, type ImageAttributes, type SeoAttributes } from './shared';

export interface ServiceAttributes {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  icon?: string;
  coverImage?: ImageAttributes;
  features: string[];
  /** Extra enquiry fields this service asks for, rendered dynamically. */
  enquiryFields: string[];
  featured: boolean;
  status: ContentStatus;
  sortOrder: number;
  seo?: SeoAttributes;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<ServiceAttributes>(
  {
    name: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 160 },
    shortDescription: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, required: true, maxlength: 20000 },
    icon: { type: String, trim: true, maxlength: 80 },
    coverImage: { type: imageSchema },
    features: { type: [String], default: [] },
    enquiryFields: { type: [String], default: [] },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: CONTENT_STATUSES, default: 'published' },
    sortOrder: { type: Number, default: 0 },
    seo: { type: seoSchema },
  },
  { timestamps: true, toJSON: baseToJSON },
);

serviceSchema.index({ status: 1, sortOrder: 1 });
serviceSchema.index({ featured: 1, status: 1 });

export type ServiceDocument = HydratedDocument<ServiceAttributes>;

export const Service: Model<ServiceAttributes> =
  (models.Service as Model<ServiceAttributes>) ??
  model<ServiceAttributes>('Service', serviceSchema);
