import type { Listing, ListingImage } from './listing';
import type { UserProfile } from './user';

/** Listing with seller and images for search results */
export interface ListingWithSeller extends Listing {
  images: ListingImage[];
  users: UserProfile;
}

export interface SearchParams {
  query?: string;
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: number;
  brand?: string;
  gender?: string;
  dexterity?: string;
  size?: string;
  shaftFlex?: string;
  shaftMaterial?: string;
  loft?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResponse {
  listings: ListingWithSeller[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  appliedFilters?: Record<string, string | null>;
}

export interface SearchSuggestion {
  text: string;
  type: string;
  icon?: string;
  listingId?: string;
  userId?: string;
  image?: string;
  filters?: Record<string, string>;
}

export interface SearchSuggestionsResponse {
  suggestions: SearchSuggestion[];
}
