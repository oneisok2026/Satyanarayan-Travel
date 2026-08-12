import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type Model,
  type Types,
} from 'mongoose';
import {
  ENQUIRY_STATUSES,
  ENQUIRY_TYPES,
  type EnquiryStatus,
  type EnquiryType,
} from '@/constants';
import { baseToJSON } from './shared';

export interface EnquiryNoteAttributes {
  authorId: Types.ObjectId;
  authorName: string;
  note: string;
  createdAt: Date;
}

export interface EnquiryAttributes {
  _id: Types.ObjectId;
  referenceCode: string;
  type: EnquiryType;
  /** Absent for guest enquiries — the public forms do not require an account. */
  userId?: Types.ObjectId;
  packageId?: Types.ObjectId;
  destinationId?: Types.ObjectId;
  serviceSlug?: string;
  name: string;
  email: string;
  phone: string;
  travelDate?: Date;
  travellers: { adults: number; children: number };
  budget?: number;
  message?: string;
  /** Free-form per-service fields (pickup city, hotel category, sector…). */
  serviceDetails?: Record<string, string | number | boolean>;
  status: EnquiryStatus;
  /**
   * When an admin first opened this enquiry.
   *
   * Separate from `status` on purpose: reading an enquiry is not the same as
   * having contacted the customer, so the notification badge clears without
   * advancing the workflow and misreporting what has actually been done.
   */
  readAt?: Date;
  internalNotes: EnquiryNoteAttributes[];
  source: string;
  /** Retained for abuse investigation only; never surfaced to clients. */
  ipHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<EnquiryNoteAttributes>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true, trim: true, maxlength: 120 },
    note: { type: String, required: true, trim: true, maxlength: 4000 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const enquirySchema = new Schema<EnquiryAttributes>(
  {
    referenceCode: { type: String, required: true, unique: true, trim: true, maxlength: 32 },
    type: { type: String, enum: ENQUIRY_TYPES, required: true, default: 'general' },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    packageId: { type: Schema.Types.ObjectId, ref: 'TourPackage' },
    destinationId: { type: Schema.Types.ObjectId, ref: 'Destination' },
    serviceSlug: { type: String, trim: true, maxlength: 60 },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, required: true, trim: true, maxlength: 24 },
    travelDate: { type: Date },
    travellers: {
      adults: { type: Number, default: 1, min: 1, max: 60 },
      children: { type: Number, default: 0, min: 0, max: 60 },
    },
    budget: { type: Number, min: 0 },
    message: { type: String, trim: true, maxlength: 4000 },
    serviceDetails: { type: Schema.Types.Mixed },
    status: { type: String, enum: ENQUIRY_STATUSES, default: 'new' },
    readAt: { type: Date },
    internalNotes: { type: [noteSchema], default: [] },
    source: { type: String, default: 'website', trim: true, maxlength: 60 },
    ipHash: { type: String, select: false, maxlength: 64 },
  },
  { timestamps: true, toJSON: baseToJSON },
);

// Admin inbox, newest first, filtered by status.
enquirySchema.index({ status: 1, createdAt: -1 });
// Unread feed for the notification bell.
enquirySchema.index({ readAt: 1, createdAt: -1 });
// Customer's own enquiry history.
enquirySchema.index({ userId: 1, createdAt: -1 });
// Enquiries against a given package.
enquirySchema.index({ packageId: 1, createdAt: -1 });
// Service-specific admin views.
enquirySchema.index({ type: 1, status: 1, createdAt: -1 });
// Duplicate detection for the same email in a short window.
enquirySchema.index({ email: 1, createdAt: -1 });

export type EnquiryDocument = HydratedDocument<EnquiryAttributes>;

export const Enquiry: Model<EnquiryAttributes> =
  (models.Enquiry as Model<EnquiryAttributes>) ??
  model<EnquiryAttributes>('Enquiry', enquirySchema);
