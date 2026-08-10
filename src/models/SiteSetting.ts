import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type Model,
  type Types,
} from 'mongoose';
import { baseToJSON } from './shared';

/**
 * Key/value settings store.
 *
 * A single document per key rather than one giant settings blob, so a
 * concurrent admin edit to contact details cannot clobber an unrelated SEO
 * change made at the same time.
 */
export interface SiteSettingAttributes {
  _id: Types.ObjectId;
  key: string;
  value: unknown;
  group: string;
  /** Non-public settings are never returned by the public settings endpoint. */
  isPublic: boolean;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const siteSettingSchema = new Schema<SiteSettingAttributes>(
  {
    key: { type: String, required: true, unique: true, trim: true, maxlength: 120 },
    value: { type: Schema.Types.Mixed },
    group: { type: String, default: 'general', trim: true, maxlength: 60 },
    isPublic: { type: Boolean, default: false },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, toJSON: baseToJSON },
);

siteSettingSchema.index({ group: 1 });
siteSettingSchema.index({ isPublic: 1 });

export type SiteSettingDocument = HydratedDocument<SiteSettingAttributes>;

export const SiteSetting: Model<SiteSettingAttributes> =
  (models.SiteSetting as Model<SiteSettingAttributes>) ??
  model<SiteSettingAttributes>('SiteSetting', siteSettingSchema);
