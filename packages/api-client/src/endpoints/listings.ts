import { apiClient } from '../client';
import type {
  Listing,
  ListingWithImages,
  ListingStatus,
  ImportListingsResponse,
  PublishListingResponse,
  PublishListingsBulkResponse,
} from '../types/listing';
import type { ListingWithSeller } from '../types/search';

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
  subcategory?: string;
  brand?: string;
  model?: string;
  price: number;
  /** Defaults to "UK" server-side if omitted */
  location?: string;
  /** Defaults to true on the web /sell flow to match mobile UX */
  is_negotiable?: boolean;
  parcel_size?: string;
  shipping_cost?: number;
  /** 1–5. For Clubs, server auto-computes from head/shaft/grip if omitted. */
  condition_overall?: number;
  /** Clubs only — 1–5 */
  condition_head?: number;
  /** Clubs only — 1–5 */
  condition_shaft?: number;
  /** Clubs only — 1–5 */
  condition_grip?: number;
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
  const res = await apiClient.get<{ listing: ListingWithImages }>(`/api/listings/${id}`);
  return res.listing;
}

/**
 * Create a new listing.
 * Backend route: POST /api/listings
 */
export async function createListing(data: CreateListingData): Promise<Listing> {
  const res = await apiClient.post<{ listing: Listing }>('/api/listings', data);
  return res.listing;
}

/**
 * Update a listing.
 * Backend route: PUT /api/listings/:id
 */
export async function updateListing(
  id: string,
  data: UpdateListingData
): Promise<Listing> {
  const res = await apiClient.put<{ listing: Listing }>(`/api/listings/${id}`, data);
  return res.listing;
}

/**
 * Delete a listing.
 * Backend route: DELETE /api/listings/:id
 */
export async function deleteListing(id: string): Promise<void> {
  return apiClient.delete<void>(`/api/listings/${id}`);
}

/**
 * Upload a single image to a listing.
 * Backend route: POST /api/listings/:id/images
 *
 * Backend uses multer.array('images', 5) — the form-data field name MUST be
 * 'images' (plural), even when sending one file at a time. Mobile uploads
 * one-per-request to avoid 413 payload errors; web does the same.
 */
export async function uploadListingImage(
  listingId: string,
  file: File
): Promise<{ message: string; count: number }> {
  const formData = new FormData();
  formData.append('images', file);

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

export async function markListingOffSale(id: string): Promise<Listing> {
  return apiClient.put<Listing>(`/api/listings/${id}/off-sale`, {});
}

export async function relistListing(id: string): Promise<Listing> {
  return apiClient.put<Listing>(`/api/listings/${id}/relist`, {});
}

// --- BULK OPERATIONS ---
// TODO: These endpoints do not exist in the backend yet.
// HS needs to add PATCH /api/listings/bulk and DELETE /api/listings/bulk.
// See output/questions.md for suggested route implementations.
// The frontend code below is ready and will work once the endpoints exist.

export async function bulkUpdateListings(
  data: BulkUpdateData
): Promise<{ updated: number }> {
  return apiClient.patch<{ updated: number }>('/api/listings/bulk', data);
}

export async function bulkDeleteListings(
  ids: string[]
): Promise<{ deleted: number }> {
  return apiClient.post<{ deleted: number }>('/api/listings/bulk-delete', {
    ids,
  });
}

/**
 * Import listings from a CSV file via the backend pipeline.
 * Backend route: POST /api/listings/import (multipart, field name 'file')
 */
export async function importListingsCsv(
  file: File
): Promise<ImportListingsResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const baseUrl =
    typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_API_URL || 'https://api.mulligans.uk.com'
      : 'https://api.mulligans.uk.com';

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('mulligans_auth_token')
      : null;

  const response = await fetch(`${baseUrl}/api/listings/import`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    let data: unknown;
    try { data = await response.json(); } catch { /* not JSON */ }
    const { ApiError } = await import('../client');
    throw new ApiError(response.status, response.statusText, data);
  }

  return response.json();
}

/**
 * Publish a single draft listing.
 * Backend route: PUT /api/listings/:id/publish
 */
export async function publishListing(id: string): Promise<PublishListingResponse> {
  return apiClient.put<PublishListingResponse>(`/api/listings/${id}/publish`, {});
}

/**
 * Bulk-publish draft listings (≤500).
 * Backend route: PUT /api/listings/publish-bulk
 */
export async function publishListingsBulk(
  listing_ids: string[]
): Promise<PublishListingsBulkResponse> {
  return apiClient.put<PublishListingsBulkResponse>('/api/listings/publish-bulk', {
    listing_ids,
  });
}

/** GET /api/listings/seller/:sellerId — public seller listings */
export function getSellerListings(
  sellerId: string,
  params?: { page?: number; limit?: number; category?: string }
) {
  return apiClient.get<{ listings: ListingWithSeller[]; total: number }>(
    `/api/listings/seller/${sellerId}`,
    { params: params as Record<string, string | number | boolean | undefined> }
  );
}
