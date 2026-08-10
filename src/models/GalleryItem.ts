import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type Model,
  type Types,
} from 'mongoose';
import { CONTENT_STATUSES, type ContentStatus } from '@/constants';
import { imageSchema, baseToJSON, type ImageAttributes } from './shared';

export interface GalleryItemAttributes {
  _id: Types.ObjectId;
  album: string;
  albumSlug: string;
  image: ImageAttributes;
  caption?: string;
  destinationId?: Types.ObjectId;
  sortOrder: number;
  status: ContentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const galleryItemSchema = new Schema<GalleryItemAttributes>(
  {
    album: { type: String, required: true, trim: true, maxlength: 140 },
    albumSlug: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
    image: { type: imageSchema, required: true },
    caption: { type: String, trim: true, maxlength: 300 },
    destinationId: { type: Schema.Types.ObjectId, ref: 'Destination' },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: CONTENT_STATUSES, default: 'published' },
  },
  { timestamps: true, toJSON: baseToJSON },
);

// Public gallery grid, grouped by album and ordered.
galleryItemSchema.index({ status: 1, albumSlug: 1, sortOrder: 1 });
galleryItemSchema.index({ albumSlug: 1, sortOrder: 1 });

export type GalleryItemDocument = HydratedDocument<GalleryItemAttributes>;

export const GalleryItem: Model<GalleryItemAttributes> =
  (models.GalleryItem as Model<GalleryItemAttributes>) ??
  model<GalleryItemAttributes>('GalleryItem', galleryItemSchema);
