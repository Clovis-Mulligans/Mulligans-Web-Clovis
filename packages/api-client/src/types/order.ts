export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'to_ship'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'disputed'
  | 'refunded'
  | 'returned'
  | 'delivery_failed'
  | 'return_in_progress';

/** Flattened order returned by getMySales */
export interface SoldOrder {
  id: string;
  listing_id: string;
  listing_title: string;
  listing_image: string | null;
  amount: number;
  quantity: number;
  selected_size: string | null;
  seller_payout: number | null;
  created_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  auto_cancel_at: string | null;
  refunded_at: string | null;
  refund_amount: number | null;
  escrow_release_at: string | null;
  buyer_id: string;
  buyer_name: string;
  buyer_avatar: string | null;
  buyer_rating: number | null;
  status: OrderStatus;
  tracking_number: string | null;
  carrier: string | null;
  shipping_address: string | null;
  is_new: boolean;
  days_to_ship: number | null;
  reported_lost_at: string | null;
  insurance_claim_status: string | null;
}

/** Flattened order returned by getMyPurchases */
export interface PurchasedOrder {
  id: string;
  listing_id: string;
  listing_title: string;
  listing_image: string | null;
  amount: number;
  quantity: number;
  selected_size: string | null;
  created_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  escrow_release_at: string | null;
  seller_id: string;
  seller_name: string;
  seller_avatar: string | null;
  seller_rating: number | null;
  status: OrderStatus;
  tracking_number: string | null;
  carrier: string | null;
  has_reviewed: boolean;
  is_new: boolean;
  can_confirm_receipt: boolean;
  can_report_lost: boolean;
  reported_lost_at: string | null;
  insurance_claim_status: string | null;
}

/** Full order detail returned by getOrderById */
export interface OrderDetail {
  id: string;
  listing_id: string;
  listing: {
    title: string;
    description: string | null;
    category: string;
    subcategory: string | null;
    brand: string | null;
    price: number;
    images: { image_url: string; display_order: number }[];
  };
  amount: number;
  quantity: number;
  selected_size: string | null;
  shipping_cost: number;
  seller_payout: number | null;
  currency: string;
  status: OrderStatus;
  created_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  auto_cancel_at: string | null;
  escrow_release_at: string | null;
  tracking_number: string | null;
  carrier: string | null;
  label_url: string | null;
  shipping_address: string | null;
  buyer: OrderParty;
  seller: OrderParty;
  is_buyer: boolean;
  is_seller: boolean;
  reviews: OrderReview[];
  has_reviewed: boolean;
  dispute: OrderDispute | null;
  dispute_reason: string | null;
  cancel_reason: string | null;
  can_confirm_receipt: boolean;
  can_report_lost: boolean;
  days_until_release: number | null;
  return_request: OrderReturn | null;
  reported_lost_at: string | null;
  insurance_claim_status: string | null;
  insurance_premium: number | null;
}

export interface OrderParty {
  id: string;
  name: string;
  display_name: string | null;
  avatar: string | null;
  avatar_url: string | null;
  location: string | null;
  rating: number;
  is_verified_seller: boolean;
}

export interface OrderReview {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  is_mine: boolean;
}

export interface OrderDispute {
  id: string;
  status: string;
  reason_type: string;
  reason: string;
  requested_refund_amount: number;
  requested_refund_percent: number;
  final_refund_amount: number | null;
  resolution_notes: string | null;
  seller_response: string | null;
  counter_amount: number | null;
  counter_percent: number | null;
  resolved_at: string | null;
  created_at: string;
  auto_escalated: boolean;
}

export interface OrderReturn {
  id: string;
  status: string;
  reason: string | null;
  refund_amount: number | null;
  return_tracking_number: string | null;
  return_ship_deadline: string | null;
  created_at: string;
}

export interface OrderCounts {
  pending_sales: number;
  new_purchases: number;
  total: number;
}
