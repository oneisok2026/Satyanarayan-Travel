import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type Model,
  type Types,
} from 'mongoose';
import { CONTENT_STATUSES, type ContentStatus } from '@/constants';
import { baseToJSON } from './shared';

export interface CategoryAttributes {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  featured: boolean;
  status: ContentStatus;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<CategoryAttributes>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 140 },
    description: { type: String, trim: true, maxlength: 600 },
    icon: { type: String, trim: true, maxlength: 80 },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: CONTENT_STATUSES, default: 'published' },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: baseToJSON },
);

categorySchema.index({ status: 1, sortOrder: 1 });

export type CategoryDocument = HydratedDocument<CategoryAttributes>;

export const Category: Model<CategoryAttributes> =
  (models.Category as Model<CategoryAttributes>) ??
  model<CategoryAttributes>('Category', categorySchema);
