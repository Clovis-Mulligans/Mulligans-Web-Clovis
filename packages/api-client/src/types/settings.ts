/** User settings as returned by GET /api/users/me */
export interface ProStoreSettings {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  rating: string;
  location: string | null;
  bio: string | null;
  postcode_area: string | null;
  preferred_carriers: string | null;
  default_shipping_cost: string | null;
  offers_free_shipping: boolean;
  email_notifications: boolean;
  order_notifications: boolean;
  marketing_emails: boolean;
  total_sales: number;
  stripe_connect_status: string | null;
  // Pro store fields
  is_pro_store: boolean;
  pro_store_name: string | null;
  pro_store_website: string | null;
  pro_store_approved_at: string | null;
  // Name change restriction (requires migration)
  pro_store_name_changed_at: string | null;
  // Computed fields from backend
  has_listings: boolean;
  has_sales: boolean;
  needs_bank_details: boolean;
  created_at: string;
}

/** Fields accepted by PUT /api/users/me */
export interface UpdateSettingsData {
  display_name?: string;
  avatar_url?: string;
  location?: string;
  bio?: string;
  postcode_area?: string;
  preferred_carriers?: string;
  default_shipping_cost?: number | null;
  offers_free_shipping?: boolean;
  email_notifications?: boolean;
  order_notifications?: boolean;
  marketing_emails?: boolean;
}
