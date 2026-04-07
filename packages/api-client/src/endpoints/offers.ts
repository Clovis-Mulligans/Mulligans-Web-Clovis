import { apiClient } from '../client';
import type { ReceivedOffer, MadeOffer, OfferCounts } from '../types/offer';

// --- Request Types ---

export interface CounterOfferData {
  counter_amount: number;
}

// --- Endpoint Functions ---

/** GET /api/offers/received — offers received as seller */
export function getReceivedOffers() {
  return apiClient.get<{ offers: ReceivedOffer[] }>('/api/offers/received');
}

/** GET /api/offers/my-offers — offers made as buyer */
export function getMyOffers() {
  return apiClient.get<{ offers: MadeOffer[] }>('/api/offers/my-offers');
}

/** PUT /api/offers/:id/accept — seller accepts an offer */
export function acceptOffer(id: string) {
  return apiClient.put<{ message: string }>(`/api/offers/${id}/accept`);
}

/** PUT /api/offers/:id/decline — seller declines an offer */
export function declineOffer(id: string) {
  return apiClient.put<{ message: string }>(`/api/offers/${id}/decline`);
}

/** PUT /api/offers/:id/counter — seller counters with new amount */
export function counterOffer(id: string, data: CounterOfferData) {
  return apiClient.put<{ message: string }>(`/api/offers/${id}/counter`, data);
}

/** PUT /api/offers/:id/accept-counter — buyer accepts counter offer */
export function acceptCounter(id: string) {
  return apiClient.put<{ message: string }>(`/api/offers/${id}/accept-counter`);
}

/** PUT /api/offers/:id/decline-counter — buyer declines counter offer */
export function declineCounter(id: string) {
  return apiClient.put<{ message: string }>(`/api/offers/${id}/decline-counter`);
}

/** PUT /api/offers/:id/withdraw — buyer withdraws offer */
export function withdrawOffer(id: string) {
  return apiClient.put<{ message: string }>(`/api/offers/${id}/withdraw`);
}

/** GET /api/offers/counts — offer badge counts */
export function getOfferCounts() {
  return apiClient.get<OfferCounts>('/api/offers/counts');
}

/**
 * NOTE: "Send Offer to Watchers" endpoint does NOT exist in the backend.
 * This needs to be added in a future backend update.
 * Placeholder function for when the endpoint is available.
 */
export function sendOfferToWatchers(
  _listingId: string,
  _data: { offer_amount: number; expires_in_hours?: number }
) {
  // TODO: Backend endpoint needed — POST /api/offers/send-to-watchers or similar
  return Promise.reject(new Error('Send Offer to Watchers endpoint not yet implemented in backend'));
}

/** POST /api/offers — create a new offer on a listing */
export function createOffer(data: { listing_id: string; offer_amount: number }) {
  return apiClient.post<{ offer: ReceivedOffer }>('/api/offers', data);
}

/** GET /api/offers/:id — get single offer detail */
export function getOffer(id: string) {
  return apiClient.get<{ offer: ReceivedOffer }>(`/api/offers/${id}`);
}

