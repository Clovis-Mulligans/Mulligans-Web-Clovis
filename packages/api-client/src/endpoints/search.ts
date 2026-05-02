import { apiClient } from '../client';
import type {
  SearchParams,
  SearchResponse,
  SearchSuggestionsResponse,
  ListingWithSeller,
} from '../types/search';

/** GET /api/search/ — search listings with filters */
export function searchListings(params?: SearchParams) {
  const queryParams: Record<string, string | number | boolean | undefined> = {};
  if (params) {
    // Existing fields
    if (params.query) queryParams.query = params.query;
    if (params.category) queryParams.category = params.category;
    if (params.subcategory) queryParams.subcategory = params.subcategory;
    if (params.minPrice !== undefined) queryParams.minPrice = params.minPrice;
    if (params.maxPrice !== undefined) queryParams.maxPrice = params.maxPrice;
    if (params.condition !== undefined) queryParams.condition = params.condition;
    if (params.brand) queryParams.brand = params.brand;
    if (params.gender) queryParams.gender = params.gender;
    if (params.dexterity) queryParams.dexterity = params.dexterity;
    if (params.size) queryParams.size = params.size;
    if (params.shaftFlex) queryParams.shaftFlex = params.shaftFlex;
    if (params.shaftMaterial) queryParams.shaftMaterial = params.shaftMaterial;
    if (params.loft !== undefined) queryParams.loft = params.loft;
    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;
    if (params.sortBy) queryParams.sortBy = params.sortBy;
    if (params.sortOrder) queryParams.sortOrder = params.sortOrder;

    // NEW fields — backend already supports these, plumbing them through frontend
    if (params.gripSize) queryParams.gripSize = params.gripSize;
    if (params.setMakeup) queryParams.setMakeup = params.setMakeup;
    if (params.lieAngle !== undefined) queryParams.lieAngle = params.lieAngle;
    if (params.length !== undefined) queryParams.length = params.length;
    if (params.color) queryParams.color = params.color;
    if (params.location) queryParams.location = params.location;
    if (params.waist) queryParams.waist = params.waist;
    if (params.gloveSize) queryParams.gloveSize = params.gloveSize;
    if (params.headType) queryParams.headType = params.headType;
  }
  return apiClient.get<SearchResponse>('/api/search/', { params: queryParams });
}

/** GET /api/search/suggestions?q={query} */
export function getSearchSuggestions(query: string) {
  return apiClient.get<SearchSuggestionsResponse>('/api/search/suggestions', {
    params: { q: query },
  });
}

/** GET /api/listings/featured — featured listings for home page */
export function getFeaturedListings(limit?: number) {
  return apiClient.get<{ listings: ListingWithSeller[]; total: number }>(
    '/api/listings/featured',
    { params: limit ? { limit } : undefined }
  );
}
