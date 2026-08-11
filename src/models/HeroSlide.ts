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

/**
 * Homepage hero slide.
 *
 * Its own collection rather than a reuse of GalleryItem: a slide carries
 * headline copy and a call to action that no other image has, and the
 * homepage must be able to order and publish them independently of the
 * gallery.
 *
 * Every text field is optional except the headline, so a slide can be added
 * with an image and a title alone and refined later.
 */
export interface HeroSlideAttributes {
  _id: Types.ObjectId;
  image: ImageAttributes;
  /** Small label above the headline, e.g. "Handcrafted journeys since 2009". */
  eyebrow?: string;
  headline: string;
  /** Rendered in the accent colour on its own line beneath the headline. */
  headlineAccent?: string;
  subheadline?: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  sortOrder: number;
  status: ContentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const heroSlideSchema = new Schema<HeroSlideAttributes>(
  {
    image: { type: imageSchema, required: true },
    eyebrow: { type: String, trim: true, maxlength: 80 },
    headline: { type: String, required: true, trim: true, maxlength: 120 },
    headlineAccent: { type: String, trim: true, maxlength: 120 },
    subheadline: { type: String, trim: true, maxlength: 400 },
    ctaLabel: { type: String, trim: true, maxlength: 40 },
    ctaHref: { type: String, trim: true, maxlength: 300 },
    secondaryCtaLabel: { type: String, trim: true, maxlength: 40 },
    secondaryCtaHref: { type: String, trim: true, maxlength: 300 },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: CONTENT_STATUSES, default: 'published' },
  },
  { timestamps: true, toJSON: baseToJSON },
);

// The homepage query: published slides in display order.
heroSlideSchema.index({ status: 1, sortOrder: 1 });

export type HeroSlideDocument = HydratedDocument<HeroSlideAttributes>;

export const HeroSlide: Model<HeroSlideAttributes> =
  (models.HeroSlide as Model<HeroSlideAttributes>) ??
  model<HeroSlideAttributes>('HeroSlide', heroSlideSchema);
