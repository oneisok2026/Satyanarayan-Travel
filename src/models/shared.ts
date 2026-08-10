import { Schema } from 'mongoose';

/** Sub-schemas reused across models. `_id: false` keeps embedded docs lean. */

export interface ImageAttributes {
  url: string;
  alt: string;
  width?: number;
  height?: number;
  caption?: string;
}

export const imageSchema = new Schema<ImageAttributes>(
  {
    url: { type: String, required: true, trim: true, maxlength: 1024 },
    // Required so every image ships with alt text (accessibility + SEO).
    alt: { type: String, required: true, trim: true, maxlength: 300, default: '' },
    width: { type: Number, min: 1 },
    height: { type: Number, min: 1 },
    caption: { type: String, trim: true, maxlength: 300 },
  },
  { _id: false },
);

export interface SeoAttributes {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
}

export const seoSchema = new Schema<SeoAttributes>(
  {
    title: { type: String, trim: true, maxlength: 70 },
    description: { type: String, trim: true, maxlength: 200 },
    keywords: { type: [String], default: undefined },
    ogImage: { type: String, trim: true, maxlength: 1024 },
  },
  { _id: false },
);

/** Strips Mongoose internals from anything serialized toward a client. */
export const baseToJSON = {
  virtuals: true,
  transform(_doc: unknown, ret: Record<string, unknown>) {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.__v;
    return ret;
  },
} as const;
