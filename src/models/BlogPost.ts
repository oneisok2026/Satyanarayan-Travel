import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type Model,
  type Types,
} from 'mongoose';
import { CONTENT_STATUSES, type ContentStatus } from '@/constants';
import { imageSchema, seoSchema, baseToJSON, type ImageAttributes, type SeoAttributes } from './shared';

export interface BlogPostAttributes {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: ImageAttributes;
  category?: string;
  tags: string[];
  authorId?: Types.ObjectId;
  authorName: string;
  authorPhoto?: string;
  readingMinutes: number;
  status: ContentStatus;
  publishedAt?: Date;
  viewCount: number;
  seo?: SeoAttributes;
  createdAt: Date;
  updatedAt: Date;
}

const blogPostSchema = new Schema<BlogPostAttributes>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 220 },
    excerpt: { type: String, required: true, trim: true, maxlength: 400 },
    content: { type: String, required: true, maxlength: 100000 },
    coverImage: { type: imageSchema, required: true },
    category: { type: String, trim: true, maxlength: 80 },
    tags: { type: [String], default: [] },
    authorId: { type: Schema.Types.ObjectId, ref: 'User' },
    authorName: { type: String, required: true, trim: true, maxlength: 120 },
    authorPhoto: { type: String, trim: true, maxlength: 1024 },
    readingMinutes: { type: Number, default: 3, min: 1 },
    status: { type: String, enum: CONTENT_STATUSES, default: 'draft' },
    publishedAt: { type: Date },
    viewCount: { type: Number, default: 0, min: 0 },
    seo: { type: seoSchema },
  },
  { timestamps: true, toJSON: baseToJSON },
);

// Public blog listing, newest published first.
blogPostSchema.index({ status: 1, publishedAt: -1 });
// Category and tag filters.
blogPostSchema.index({ category: 1, status: 1, publishedAt: -1 });
blogPostSchema.index({ tags: 1, status: 1 });
// Search.
blogPostSchema.index({ title: 'text', excerpt: 'text' });

export type BlogPostDocument = HydratedDocument<BlogPostAttributes>;

export const BlogPost: Model<BlogPostAttributes> =
  (models.BlogPost as Model<BlogPostAttributes>) ??
  model<BlogPostAttributes>('BlogPost', blogPostSchema);
