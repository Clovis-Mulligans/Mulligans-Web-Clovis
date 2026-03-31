/** Matches the Prisma `users` model exactly */
export interface User {
  id: string;
  cognito_id: string;
  email: string;
  display_name: string | null;
  phone: string | null;
  location: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_verified_seller: boolean;
  rating: string; // Decimal as string
  total_sales: number;
  total_purchases: number;
  created_at: string;
  updated_at: string;
  deletion_requested_at: string | null;
  deletion_scheduled_for: string | null;
  default_shipping_cost: string | null;
  offers_free_shipping: boolean;
  postcode_area: string | null;
  preferred_carriers: string | null;
  email_notifications: boolean;
  marketing_emails: boolean;
  sms_marketing_consent: boolean;
  order_notifications: boolean;
  handicap: string | null;
  clothing_size: string[];
  glove_size: string[];
  shoe_size: string[];
  sizing_preference: string | null;
  stripe_connect_id: string | null;
  stripe_connect_status: string | null;
  shipping_strikes: number;
  buyer_cancellation_count: number;
  seller_cancellation_count: number;
  push_token: string | null;
  push_token_platform: string | null;
  is_banned: boolean;
  ban_reason: string | null;
  banned_at: string | null;
  password_reset_code: string | null;
  password_reset_code_expires: string | null;
  verification_code: string | null;
  verification_code_expires: string | null;
  verified_seller_at: string | null;
  // Pro store fields
  is_pro_store: boolean;
  pro_store_name: string | null;
  pro_store_website: string | null;
  pro_store_approved_at: string | null;
  subscription_status: string | null;
  subscription_started_at: string | null;
}

/** Minimal user profile returned in public contexts */
export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  is_verified_seller: boolean;
  rating: string;
  total_sales: number;
  location: string | null;
  is_pro_store: boolean;
  pro_store_name: string | null;
  created_at: string;
}
