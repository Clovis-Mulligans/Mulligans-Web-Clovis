import { apiClient } from '../client';
import type { Listing, ListingWithImages, ListingStatus } from '../types/listing';

// --- Request/Response Types ---

export interface GetMyListingsParams {
  status?: ListingStatus | 'all';
  category?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
}

export interface GetMyListingsResponse {
  listings: ListingWithImages[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateListingData {
  title: string;
  description?: string;
  category: string;
  brand?: string;
  model?: string;
  price: number;
  condition_overall?: number;
  is_negotiable?: boolean;
  parcel_size?: string;
  shipping_cost?: number;
  subcategory?: string;
  specifications?: Record<string, unknown>;
  status?: 'active' | 'draft';
  quantity?: number;
}

export interface UpdateListingData extends Partial<CreateListingData> {}

export interface BulkUpdateData {
  ids: string[];
  status?: ListingStatus;
  price?: number;
  price_adjustment_percent?: number;
  original_price?: number;
}

// --- Endpoint Functions ---

/**
 * Get the authenticated seller's own listings.
 * Backend route: GET /api/users/my-listings
 */
export async function getMyListings(
  params?: GetMyListingsParams
): Promise<GetMyListingsResponse> {
  const queryParams: Record<string, string | number | boolean | undefined> = {};
  if (params) {
    if (params.status && params.status !== 'all') queryParams.status = params.status;
    if (params.category) queryParams.category = params.category;
    if (params.condition) queryParams.condition = params.condition;
    if (params.minPrice !== undefined) queryParams.minPrice = params.minPrice;
    if (params.maxPrice !== undefined) queryParams.maxPrice = params.maxPrice;
    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;
    if (params.sort) queryParams.sort = params.sort;
    if (params.search) queryParams.search = params.search;
  }
  return apiClient.get<GetMyListingsResponse>('/api/users/my-listings', {
    params: queryParams,
  });
}

/**
 * Get a single listing by ID.
 * Backend route: GET /api/listings/:id
 */
export async function getListing(id: string): Promise<ListingWithImages> {
  return apiClient.get<ListingWithImages>(`/api/listings/${id}`);
}

/**
 * Create a new listing.
 * Backend route: POST /api/listings
 */
export async function createListing(data: CreateListingData): Promise<Listing> {
  return apiClient.post<Listing>('/api/listings', data);
}

/**
 * Update a listing.
 * Backend route: PUT /api/listings/:id
 * Note: Backend uses PUT, not PATCH.
 */
export async function updateListing(
  id: string,
  data: UpdateListingData
): Promise<Listing> {
  return apiClient.put<Listing>(`/api/listings/${id}`, data);
}

/**
 * Delete a listing.
 * Backend route: DELETE /api/listings/:id
 */
export async function deleteListing(id: string): Promise<void> {
  return apiClient.delete<void>(`/api/listings/${id}`);
}

/**
 * Upload an image to a listing.
 * Backend route: POST /api/listings/:id/images
 * Note: This uses FormData, not JSON.
 */
export async function uploadListingImage(
  listingId: string,
  file: File
): Promise<{ id: string; image_url: string }> {
  const formData = new FormData();
  formData.append('image', file);

  const baseUrl =
    typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_API_URL || 'https://api.mulligans.uk.com'
      : 'https://api.mulligans.uk.com';

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('mulligans_auth_token')
      : null;

  const response = await fetch(`${baseUrl}/api/listings/${listingId}/images`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Image upload failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Delete an image from a listing.
 * Backend route: DELETE /api/listings/:id/images/:imageId
 */
export async function deleteListingImage(
  listingId: string,
  imageId: string
): Promise<void> {
  return apiClient.delete<void>(
    `/api/listings/${listingId}/images/${imageId}`
  );
}

// --- BULK OPERATIONS ---
// TODO: These endpoints do not exist in the backend yet.
// HS needs to add PATCH /api/listings/bulk and DELETE /api/listings/bulk.
// See output/questions.md for suggested route implementations.
// The frontend code below is ready and will work once the endpoints exist.

/**
 * Bulk update listings (status, price).
 * Backend route: PATCH /api/listings/bulk — DOES NOT EXIST YET
 */
export async function bulkUpdateListings(
  data: BulkUpdateData
): Promise<{ updated: number }> {
  return apiClient.patch<{ updated: number }>('/api/listings/bulk', data);
}

/**
 * Bulk delete listings.
 * Backend route: DELETE /api/listings/bulk — DOES NOT EXIST YET
 */
export async function bulkDeleteListings(
  ids: string[]
): Promise<{ deleted: number }> {
  return apiClient.post<{ deleted: number }>('/api/listings/bulk-delete', {
    ids,
  });
}
