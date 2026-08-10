import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type Model,
  type Types,
} from 'mongoose';
import { REVIEW_STATUSES, type ReviewStatus } from '@/constants';
import { baseToJSON } from './shared';

export interface ReviewAttributes {
  _id: Types.ObjectId;
  packageId?: Types.ObjectId;
  userId: Types.ObjectId;
  authorName: string;
  authorPhoto?: string;
  rating: number;
  title?: string;
  comment: string;
  status: ReviewStatus;
  travelDate?: Date;
  /** True when the reviewer has a completed booking for this package. */
  verifiedBooking: boolean;
  moderatedBy?: Types.ObjectId;
  moderatedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<ReviewAttributes>(
  {
    packageId: { type: Schema.Types.ObjectId, ref: 'TourPackage' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true, trim: true, maxlength: 120 },
    authorPhoto: { type: String, trim: true, maxlength: 1024 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 160 },
    comment: { type: String, required: true, trim: true, maxlength: 4000 },
    // Moderated by default: nothing appears publicly without approval.
    status: { type: String, enum: REVIEW_STATUSES, default: 'pending' },
    travelDate: { type: Date },
    verifiedBooking: { type: Boolean, default: false },
    moderatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    moderatedAt: { type: Date },
    rejectionReason: { type: String, trim: true, maxlength: 500, select: false },
  },
  { timestamps: true, toJSON: baseToJSON },
);

// Public reviews on a package detail page.
reviewSchema.index({ packageId: 1, status: 1, createdAt: -1 });
// Admin moderation queue.
reviewSchema.index({ status: 1, createdAt: -1 });
// One review per user per package.
reviewSchema.index(
  { userId: 1, packageId: 1 },
  { unique: true, partialFilterExpression: { packageId: { $exists: true } } },
);

export type ReviewDocument = HydratedDocument<ReviewAttributes>;

export const Review: Model<ReviewAttributes> =
  (models.Review as Model<ReviewAttributes>) ??
  model<ReviewAttributes>('Review', reviewSchema);
