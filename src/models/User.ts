import { Schema, model, models, type Model, type Types } from 'mongoose';
import { USER_ROLES, USER_STATUSES, type UserRole, type UserStatus } from '@/constants';

/**
 * Application user.
 *
 * The identity bridge is `firebaseUid` — never email. Firebase owns
 * authentication; this record owns the application profile and role.
 *
 * No password field exists here by design (PRD §2: "The application database
 * must not store passwords or password hashes").
 */

export interface UserDocument {
  _id: Types.ObjectId;
  firebaseUid: string;
  email: string;
  emailVerified: boolean;
  name: string;
  phone?: string;
  photoURL?: string;
  role: UserRole;
  status: UserStatus;
  profile: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    dateOfBirth?: Date;
    passportNumber?: string;
  };
  preferences: {
    marketingEmails: boolean;
    whatsappUpdates: boolean;
  };
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      immutable: true, // the identity bridge must never be reassigned
      index: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    emailVerified: { type: Boolean, default: false },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      default: 'Traveller',
    },
    phone: { type: String, trim: true, maxlength: 24 },
    photoURL: { type: String, trim: true, maxlength: 1024 },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'customer',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: USER_STATUSES,
      default: 'active',
      required: true,
      index: true,
    },
    profile: {
      address: { type: String, trim: true, maxlength: 300 },
      city: { type: String, trim: true, maxlength: 120 },
      state: { type: String, trim: true, maxlength: 120 },
      country: { type: String, trim: true, maxlength: 120 },
      postalCode: { type: String, trim: true, maxlength: 20 },
      dateOfBirth: { type: Date },
      // Sensitive: excluded from queries by default, see the select:false note.
      passportNumber: { type: String, trim: true, maxlength: 40, select: false },
    },
    preferences: {
      marketingEmails: { type: Boolean, default: true },
      whatsappUpdates: { type: Boolean, default: true },
    },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
    // Strip internals from anything serialized toward a client.
    toJSON: {
      virtuals: true,
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

/*
 * Email is indexed but NOT unique. Firebase is the authority on identity, and
 * two Firebase accounts can legitimately share an email across providers.
 * Enforcing uniqueness here would reject valid sign-ups and could be abused to
 * block an address. (system-architecture.md §5 flags exactly this.)
 */
userSchema.index({ email: 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ createdAt: -1 });

export const User: Model<UserDocument> =
  (models.User as Model<UserDocument>) ?? model<UserDocument>('User', userSchema);
