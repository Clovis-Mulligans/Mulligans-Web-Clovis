import type { ListingWithSeller } from './search';
import type { UserProfile } from './user';

export interface CartItem {
  id: string;
  listing_id: string;
  quantity: number;
  added_at: string;
  expires_at: string;
  listing: ListingWithSeller;
}

export interface CartResponse {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export interface AddToCartData {
  listing_id: string;
  quantity?: number;
  selected_size?: string;
  offer_id?: string;
}
