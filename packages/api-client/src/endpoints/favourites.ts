import { apiClient } from '../client';
import type { FavouritesResponse, FavouriteCheckResponse } from '../types/favourite';

/** GET /api/favorites — get all favourites */
export function getFavourites() {
  return apiClient.get<FavouritesResponse>('/api/favorites');
}

/** POST /api/favorites/:listingId — add favourite */
export function addFavourite(listingId: string) {
  return apiClient.post<{ message: string }>('/api/favorites', { listing_id: listingId });
}

/** DELETE /api/favorites/:listingId — remove favourite */
export function removeFavourite(listingId: string) {
  return apiClient.delete<{ message: string }>(`/api/favorites/${listingId}`);
}

/** GET /api/favorites/check/:listingId — check if listing is favourited */
export function checkFavourite(listingId: string) {
  return apiClient.get<FavouriteCheckResponse>(`/api/favorites/check/${listingId}`);
}
