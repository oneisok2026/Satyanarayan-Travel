import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type Model,
  type Types,
} from 'mongoose';
import {
  BOOKING_STATUSES,
  PAYMENT_STATUSES,
  type BookingStatus,
  type PaymentStatus,
} from '@/constants';
import { baseToJSON } from './shared';

export interface TravellerAttributes {
  name: string;
  age: number;
  gender?: 'male' | 'female' | 'other';
}

/**
 * Prices captured at booking time. Stored rather than recomputed so a later
 * price change on the package cannot silently alter an existing booking.
 */
export interface PricingSnapshotAttributes {
  unitPrice: number;
  childPrice: number;
  adults: number;
  children: number;
  subtotal: number;
  taxes: number;
  discount: number;
  total: number;
  currency: string;
}

export interface BookingAttributes {
  _id: Types.ObjectId;
  bookingReference: string;
  /**
   * Absent for guest bookings taken from the public package cards, which do
   * not require an account. The contact block is what the agency works from.
   */
  userId?: Types.ObjectId;
  packageId: Types.ObjectId;
  /** Denormalized so a deleted package doesn't blank out booking history. */
  packageTitle: string;
  packageSlug: string;
  travelDate: Date;
  travellers: TravellerAttributes[];
  pricingSnapshot: PricingSnapshotAttributes;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  contact: { name: string; email: string; phone: string };
  notes?: string;
  adminNotes?: string;
  /** Client-supplied key that makes a retried submission idempotent. */
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const travellerSchema = new Schema<TravellerAttributes>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    age: { type: Number, required: true, min: 0, max: 120 },
    gender: { type: String, enum: ['male', 'female', 'other'] },
  },
  { _id: false },
);

const pricingSchema = new Schema<PricingSnapshotAttributes>(
  {
    unitPrice: { type: Number, required: true, min: 0 },
    childPrice: { type: Number, default: 0, min: 0 },
    adults: { type: Number, required: true, min: 1 },
    children: { type: Number, default: 0, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    taxes: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR', maxlength: 3 },
  },
  { _id: false },
);

const bookingSchema = new Schema<BookingAttributes>(
  {
    bookingReference: { type: String, required: true, unique: true, trim: true, maxlength: 24 },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    packageId: { type: Schema.Types.ObjectId, ref: 'TourPackage', required: true },
    packageTitle: { type: String, required: true, trim: true, maxlength: 200 },
    packageSlug: { type: String, required: true, trim: true, maxlength: 220 },
    travelDate: { type: Date, required: true },
    travellers: { type: [travellerSchema], default: [] },
    pricingSnapshot: { type: pricingSchema, required: true },
    status: { type: String, enum: BOOKING_STATUSES, default: 'requested' },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'unpaid' },
    contact: {
      name: { type: String, required: true, trim: true, maxlength: 120 },
      email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
      phone: { type: String, required: true, trim: true, maxlength: 24 },
    },
    notes: { type: String, trim: true, maxlength: 2000 },
    adminNotes: { type: String, trim: true, maxlength: 4000, select: false },
    idempotencyKey: { type: String, trim: true, maxlength: 100, select: false },
  },
  { timestamps: true, toJSON: baseToJSON },
);

bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ packageId: 1, createdAt: -1 });
bookingSchema.index({ paymentStatus: 1, createdAt: -1 });
// Partial unique index: enforces idempotency only for requests that supply a
// key, so the many bookings without one do not collide on null.
bookingSchema.index(
  { userId: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: 'string' } },
  },
);

export type BookingDocument = HydratedDocument<BookingAttributes>;

export const Booking: Model<BookingAttributes> =
  (models.Booking as Model<BookingAttributes>) ??
  model<BookingAttributes>('Booking', bookingSchema);
