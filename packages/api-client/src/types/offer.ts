export type OfferStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'COUNTERED'
  | 'COUNTER_ACCEPTED'
  | 'COUNTER_DECLINED'
  | 'EXPIRED'
  | 'VOID'
  | 'WITHDRAWN'
  | 'PURCHASED';

/** Offer returned by getReceivedOffers */
export interface ReceivedOffer {
  id: string;
  listing_id: string;
  buyer_id: string;
  offer_amount: number;
  counter_amount: number | null;
  final_amount: number | null;
  list_price: number;
  status: OfferStatus;
  offer_number: number;
  created_at: string;
  expires_at: string;
  responded_at: string | null;
  acceptance_expires_at: string | null;
  listing: {
    id: string;
    title: string;
    price: number;
    status: string;
    image: string | null;
  };
  buyer: {
    id: string;
    display_name: string | null;
  };
}

/** Offer returned by getMyOffers (made by current user) */
export interface MadeOffer {
  id: string;
  listing_id: string;
  seller_id: string;
  offer_amount: number;
  counter_amount: number | null;
  final_amount: number | null;
  list_price: number;
  status: OfferStatus;
  offer_number: number;
  created_at: string;
  expires_at: string;
  responded_at: string | null;
  acceptance_expires_at: string | null;
  listing: {
    id: string;
    title: string;
    price: number;
    status: string;
    image: string | null;
  };
}

export interface OfferCounts {
  offers_made_pending: number;
  offers_received_pending: number;
  total: number;
}
