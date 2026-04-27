import { apiClient } from '../client';

// ─── Types ─────────────────────────────────────────────────────────────────

export type DisputeStatus =
  | 'open'
  | 'counter_offered'
  | 'seller_accepted'
  | 'buyer_accepted'
  | 'escalated'
  | 'admin_resolved';

export type DisputeResolutionType = 'full_refund' | 'partial_refund' | 'no_refund';

export type DisputeResponseType = 'accept' | 'counter' | 'reject';

export interface DisputeImage {
  id: string;
  dispute_id: string;
  image_url: string;
  s3_key: string;
  uploaded_by: 'buyer' | 'seller';
  created_at: string;
}

export interface Dispute {
  id: string;
  order_id: string;
  buyer_id: string;
  seller_id: string;
  status: DisputeStatus;
  reason_type: string;
  reason_text: string;
  requested_refund_percent: number;
  requested_refund_amount: number | string;
  seller_deadline: string;
  seller_response_type: DisputeResponseType | null;
  seller_response_text: string | null;
  seller_responded_at: string | null;
  counter_offer_percent: number | null;
  counter_offer_amount: number | string | null;
  resolution_type: DisputeResolutionType | null;
  resolution_notes: string | null;
  escalated_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  images?: DisputeImage[];
}

export interface RespondToDisputeData {
  responseType: DisputeResponseType;
  counterOfferPercent?: number;
  responseText?: string;
  images?: string[];
}

export interface UploadDisputeImageResponse {
  success: boolean;
  imageUrl: string;
  s3Key?: string;
}

// ─── Endpoints ─────────────────────────────────────────────────────────────

/** GET /api/disputes/order/:orderId — fetch dispute for a given order (if one exists) */
export function getDisputeByOrder(orderId: string) {
  return apiClient.get<Dispute>(`/api/disputes/order/${orderId}`);
}

/** GET /api/disputes/:id — full dispute details (buyer or seller only) */
export function getDispute(id: string) {
  return apiClient.get<Dispute>(`/api/disputes/${id}`);
}

/** PUT /api/disputes/:id/respond — seller responds (accept / counter / reject) */
export function respondToDispute(id: string, data: RespondToDisputeData) {
  return apiClient.put<{ success: boolean; message: string }>(
    `/api/disputes/${id}/respond`,
    data,
  );
}

/** PUT /api/disputes/:id/accept-counter — buyer accepts seller's counter offer */
export function acceptCounterOffer(id: string) {
  return apiClient.put<{ success: boolean; message: string }>(
    `/api/disputes/${id}/accept-counter`,
  );
}

/** PUT /api/disputes/:id/escalate — buyer escalates to admin review */
export function escalateDispute(id: string) {
  return apiClient.put<{ success: boolean; message: string }>(
    `/api/disputes/${id}/escalate`,
  );
}

/**
 * POST /api/disputes/:id/images — upload a single evidence image (multipart/form-data).
 * The FormData must contain a field named "image".
 * Call once per image; do not batch multiple files in one request.
 */
export function uploadDisputeImage(id: string, formData: FormData) {
  return apiClient.post<UploadDisputeImageResponse>(
    `/api/disputes/${id}/images`,
    formData,
  );
}
