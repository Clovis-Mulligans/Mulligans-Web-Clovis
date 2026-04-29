import { apiClient } from '../client';

// --- Types ---

export interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  price: number;
  currency: string;
  estimatedDays: number | null;
  durationTerms: string | null;
}

export interface ParcelDetails {
  length: string;
  width: string;
  height: string;
  weight: string;
}

export interface ShippingRatesResponse {
  shipmentId: string;
  rates: ShippingRate[];
  parcelSize: string;
  parcelDetails: ParcelDetails;
}

export interface ShippingLabel {
  trackingNumber: string;
  trackingUrl: string;
  labelUrl: string;
  carrier: string;
  transactionId: string;
  labelCost: number;
}

export interface TrackingEvent {
  status: string;
  statusDetails: string;
  location: string | null;
  timestamp: string;
}

export interface TrackingInfo {
  trackingNumber: string;
  carrier: string;
  status: string;
  statusDetails: string;
  eta: string | null;
  trackingHistory: TrackingEvent[];
  labelUrl: string | null;
}

export interface ParcelSize {
  id: string;
  name: string;
  description: string;
  price: number;
}

// --- Endpoint Functions ---

/** POST /api/shipping/rates — get tracked shipping rates for an order (seller only) */
export function getShippingRates(orderId: string) {
  return apiClient.post<{ success: boolean; data: ShippingRatesResponse }>(
    '/api/shipping/rates',
    { orderId },
  );
}

/** POST /api/shipping/labels — purchase a shipping label (seller only) */
export function createShippingLabel(orderId: string, rateId: string) {
  return apiClient.post<{ success: boolean; data: ShippingLabel }>(
    '/api/shipping/labels',
    { orderId, rateId },
  );
}

/** POST /api/shipping/mark-shipped — mark order as shipped via Shippo flow (seller only) */
export function markShipped(orderId: string) {
  return apiClient.post<{ success: boolean; data: { orderId: string; status: string; shippedAt: string; trackingNumber: string } }>(
    '/api/shipping/mark-shipped',
    { orderId },
  );
}

/** GET /api/shipping/tracking/:orderId — get tracking status (buyer or seller) */
export function getTrackingInfo(orderId: string) {
  return apiClient.get<{ success: boolean; data: TrackingInfo }>(
    `/api/shipping/tracking/${orderId}`,
  );
}

/** GET /api/shipping/parcel-sizes — get parcel size options (public) */
export function getParcelSizes() {
  return apiClient.get<{ success: boolean; data: ParcelSize[] }>(
    '/api/shipping/parcel-sizes',
  );
}
