/** Matches the Prisma `pro_store_applications` model */
export interface ProStoreApplication {
  id: string;
  user_id: string;
  business_name: string;
  business_email: string;
  business_phone: string;
  website: string;
  seller_type: SellerType;
  description: string;
  estimated_listings: EstimatedListings;
  instagram_handle: string | null;
  has_existing_store: boolean;
  existing_store_url: string | null;
  status: ProStoreApplicationStatus;
  review_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ProStoreApplicationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'info_requested';

export type SellerType =
  | 'pro_shop'
  | 'online_retailer'
  | 'brand';

export type EstimatedListings =
  | '1-50'
  | '51-200'
  | '201-500'
  | '500+';

/** Data required to submit a pro store application */
export interface SubmitProStoreApplicationData {
  business_name: string;
  business_email: string;
  business_phone: string;
  website: string;
  seller_type: SellerType;
  description: string;
  estimated_listings: EstimatedListings;
  instagram_handle?: string;
  has_existing_store?: boolean;
  existing_store_url?: string;
}

/** Admin review action */
export interface ReviewProStoreApplicationData {
  action: 'approve' | 'reject' | 'request_info';
  review_notes?: string;
}
