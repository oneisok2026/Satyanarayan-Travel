import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type Model,
  type Types,
} from 'mongoose';
import { CONTENT_STATUSES, SOCIAL_PLATFORMS, type ContentStatus } from '@/constants';
import { baseToJSON } from './shared';

/**
 * A social profile shown in the site header.
 *
 * `platform` selects the icon rather than storing markup, so an admin can
 * never inject SVG through this record. Anything outside the known list is
 * rejected by the schema.
 */
export interface SocialLinkAttributes {
  _id: Types.ObjectId;
  platform: (typeof SOCIAL_PLATFORMS)[number];
  url: string;
  /** Accessible name; falls back to the platform label when blank. */
  label?: string;
  sortOrder: number;
  status: ContentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const socialLinkSchema = new Schema<SocialLinkAttributes>(
  {
    platform: { type: String, enum: SOCIAL_PLATFORMS, required: true },
    url: { type: String, required: true, trim: true, maxlength: 500 },
    label: { type: String, trim: true, maxlength: 60 },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: CONTENT_STATUSES, default: 'published' },
  },
  { timestamps: true, toJSON: baseToJSON },
);

// The header query: published links in display order.
socialLinkSchema.index({ status: 1, sortOrder: 1 });

export type SocialLinkDocument = HydratedDocument<SocialLinkAttributes>;

export const SocialLink: Model<SocialLinkAttributes> =
  (models.SocialLink as Model<SocialLinkAttributes>) ??
  model<SocialLinkAttributes>('SocialLink', socialLinkSchema);
