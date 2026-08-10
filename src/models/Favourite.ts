import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type Model,
  type Types,
} from 'mongoose';
import { baseToJSON } from './shared';

export interface FavouriteAttributes {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  packageId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const favouriteSchema = new Schema<FavouriteAttributes>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    packageId: { type: Schema.Types.ObjectId, ref: 'TourPackage', required: true },
  },
  { timestamps: true, toJSON: baseToJSON },
);

// One favourite per user per package — a double-tap cannot create two rows.
favouriteSchema.index({ userId: 1, packageId: 1 }, { unique: true });
// The user's favourites list, newest first.
favouriteSchema.index({ userId: 1, createdAt: -1 });

export type FavouriteDocument = HydratedDocument<FavouriteAttributes>;

export const Favourite: Model<FavouriteAttributes> =
  (models.Favourite as Model<FavouriteAttributes>) ??
  model<FavouriteAttributes>('Favourite', favouriteSchema);
