// Client
export { apiClient, ApiError, setAuthToken, clearAuthToken } from './client';

// Types — User
export type { User, UserProfile } from './types/user';

// Types — Listing
export type {
  Listing,
  ListingWithImages,
  ListingImage,
  ListingAttribute,
  ListingStatus,
} from './types/listing';

// Types — Pro Store
export type {
  ProStoreApplication,
  ProStoreApplicationStatus,
  SellerType,
  EstimatedListings,
  SubmitProStoreApplicationData,
  ReviewProStoreApplicationData,
} from './types/proStore';

// Endpoints — Listings
export {
  getMyListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  uploadListingImage,
  deleteListingImage,
  bulkUpdateListings,
  bulkDeleteListings,
} from './endpoints/listings';
export type {
  GetMyListingsParams,
  GetMyListingsResponse,
  CreateListingData,
  UpdateListingData,
  BulkUpdateData,
} from './endpoints/listings';

// Endpoints — Pro Store
export {
  submitProStoreApplication,
  getApplicationStatus,
} from './endpoints/proStore';

// Endpoints — Admin
export {
  getProStoreApplications,
  getProStoreApplication,
  reviewProStoreApplication,
} from './endpoints/admin';
