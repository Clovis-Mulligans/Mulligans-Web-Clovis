import { apiClient } from '../client';

// --- Types ---

export interface ReturnShippingRate {
  id: string;
  carrier: string;
  service: string;
  price: number;
  currency: string;
  estimatedDays?: number;
  durationTerms?: string;
}

export interface ReturnData {
  id: string;
  order_id: string;
  status: string;
  reason: string;
  refund_amount: number | null;
  return_shipping_cost: number | null;
  return_label_url: string | null;
  return_tracking_number: string | null;
  return_carrier: string | null;
  return_ship_deadline: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  escrow_release_at: string | null;
  label_cost: number | null;
  paid_by: string | null;
  created_at: string;
  updated_at: string;
  orders: {
    id: string;
    listing_id: string;
    amount: number;
    shipping_cost: number;
    listing_image?: string;
    listings: {
      id: string;
      title: string;
      images: string[];
      parcel_size?: string;
    } | null;
    shipping_address: {
      name: string;
      line1: string;
      line2?: string;
      city: string;
      postal_code: string;
      country: string;
    } | null;
    users_orders_buyer_idTousers: { id: string; display_name?: string };
    users_orders_seller_idTousers: { id: string; display_name?: string };
  };
  sellerHasAddress: boolean;
  canPurchaseLabel: boolean;
  isBuyer: boolean;
  isSeller: boolean;
}

export interface ReturnRatesResponse {
  shipmentId: string;
  rates: ReturnShippingRate[];
  parcelSize: string;
  sellerAddress: { city: string; postcode: string };
}

export interface PurchaseLabelResponse {
  trackingNumber: string | null;
  trackingUrl: string | null;
  labelUrl: string;
  carrier: string;
  labelCost: number;
  originalRefund?: number;
  newRefundAmount?: number;
  paidBy?: string;
  message: string;
}

// --- Endpoint Functions ---

export function getReturnRequest(returnId: string) {
  return apiClient.get<{ success: boolean; data: ReturnData }>(
    `/api/returns/${returnId}`
  );
}

export function getReturnShippingRates(returnId: string) {
  return apiClient.post<{ success: boolean; data: ReturnRatesResponse }>(
    '/api/returns/rates',
    { returnId }
  );
}

export function purchaseReturnLabelBuyer(returnId: string, rateId: string) {
  return apiClient.post<{ success: boolean; data: PurchaseLabelResponse }>(
    '/api/returns/purchase-label/buyer',
    { returnId, rateId }
  );
}

export function purchaseReturnLabelSeller(
  returnId: string,
  rateId: string,
  paymentMethodId: string
) {
  return apiClient.post<{ success: boolean; data: PurchaseLabelResponse }>(
    '/api/returns/purchase-label/seller',
    { returnId, rateId, paymentMethodId }
  );
}

export function markReturnShipped(returnId: string) {
  return apiClient.post<{ success: boolean; data: { status: string; shippedAt: string } }>(
    '/api/returns/mark-shipped',
    { returnId }
  );
}
