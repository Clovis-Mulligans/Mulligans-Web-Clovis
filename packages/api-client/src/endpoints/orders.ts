import { apiClient } from '../client';
import type { SoldOrder, PurchasedOrder, OrderDetail, OrderCounts } from '../types/order';

// --- Request Types ---

export interface GetMySalesParams {
  status?: 'to_ship' | 'in_transit' | 'cancelled' | 'completed' | 'all';
  limit?: number;
}

export interface GetMyPurchasesParams {
  status?: 'in_progress' | 'cancelled' | 'completed' | 'all';
  limit?: number;
}

export interface MarkAsShippedData {
  tracking_number: string;
  carrier: string;
}

export interface OpenDisputeData {
  reasonType: string;
  reasonText: string;
  requestedRefundPercent: number;
}

export interface CancelOrderData {
  reason: string;
  reasonText: string;
}

// --- Endpoint Functions ---

/** GET /api/orders/my-sales — seller's sold orders */
export function getMySales(params?: GetMySalesParams) {
  return apiClient.get<{ orders: SoldOrder[] }>('/api/orders/my-sales', {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

/** GET /api/orders/my-purchases — buyer's purchased orders */
export function getMyPurchases(params?: GetMyPurchasesParams) {
  return apiClient.get<{ orders: PurchasedOrder[] }>('/api/orders/my-purchases', {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

/** GET /api/orders/:id — full order detail. Backend wraps response in { order }. */
export function getOrder(id: string) {
  return apiClient.get<OrderDetail>(`/api/orders/${id}`);
}

/** PUT /api/orders/:id/ship — mark order as shipped (own-carrier only) */
export function markAsShipped(id: string, data: MarkAsShippedData) {
  return apiClient.put<{ message: string }>(`/api/orders/${id}/ship`, data);
}

/** PUT /api/orders/:id/confirm-receipt — buyer confirms delivery (releases escrow) */
export function confirmReceipt(id: string) {
  return apiClient.put<{ message: string }>(`/api/orders/${id}/confirm-receipt`);
}

/** PUT /api/orders/:id/cancel — buyer or seller cancels before label purchased */
export function cancelOrder(id: string, data: CancelOrderData) {
  return apiClient.put<{ message: string }>(`/api/orders/${id}/cancel`, data);
}

/** PUT /api/orders/:id/report-lost — buyer reports item as lost after 14+ days in transit */
export function reportLost(id: string) {
  return apiClient.put<{ message: string }>(`/api/orders/${id}/report-lost`);
}

/** PUT /api/orders/:id/viewed — mark order as viewed (clears buyer badge) */
export function markOrderViewed(id: string) {
  return apiClient.put<{ message: string }>(`/api/orders/${id}/viewed`);
}

/** GET /api/orders/counts — order badge counts */
export function getOrderCounts() {
  return apiClient.get<OrderCounts>('/api/orders/counts');
}

/**
 * POST /api/disputes — open a full dispute (buyer only).
 * Uses the dispute controller (not the simpler PUT /api/orders/:id/dispute).
 * Backend: src/controllers/disputeController.ts -> openDispute
 * Accepts: orderId, reasonType, reasonText, requestedRefundPercent (10–100, multiples of 10)
 */
export function openDispute(orderId: string, data: OpenDisputeData) {
  return apiClient.post<{ message: string; dispute: { id: string } }>('/api/disputes', {
    orderId,
    ...data,
  });
}
