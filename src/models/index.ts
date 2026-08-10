/**
 * Model barrel.
 *
 * Importing this registers every schema with Mongoose, which matters for
 * `populate()`: a ref to a model that has not been registered throws at query
 * time rather than at import time.
 */

export { User, type UserAttributes, type UserDocument } from './User';
export {
  Destination,
  type DestinationAttributes,
  type DestinationDocument,
} from './Destination';
export { Category, type CategoryAttributes, type CategoryDocument } from './Category';
export {
  TourPackage,
  type TourPackageAttributes,
  type TourPackageDocument,
  type ItineraryDayAttributes,
  type HotelAttributes,
  type JourneyDateAttributes,
} from './TourPackage';
export { Enquiry, type EnquiryAttributes, type EnquiryDocument } from './Enquiry';
export {
  Booking,
  type BookingAttributes,
  type BookingDocument,
  type TravellerAttributes,
  type PricingSnapshotAttributes,
} from './Booking';
export { Favourite, type FavouriteAttributes, type FavouriteDocument } from './Favourite';
export { Review, type ReviewAttributes, type ReviewDocument } from './Review';
export { BlogPost, type BlogPostAttributes, type BlogPostDocument } from './BlogPost';
export {
  GalleryItem,
  type GalleryItemAttributes,
  type GalleryItemDocument,
} from './GalleryItem';
export { Service, type ServiceAttributes, type ServiceDocument } from './Service';
export {
  SiteSetting,
  type SiteSettingAttributes,
  type SiteSettingDocument,
} from './SiteSetting';
export { AuditLog, type AuditLogAttributes, type AuditLogDocument } from './AuditLog';
export { type ImageAttributes, type SeoAttributes } from './shared';
