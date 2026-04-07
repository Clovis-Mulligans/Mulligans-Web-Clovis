export interface PublicProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  is_verified_seller: boolean;
  is_pro_store: boolean;
  pro_store_name: string | null;
  pro_store_website: string | null;
  rating: number;
  total_sales: number;
  location: string | null;
  bio: string | null;
  created_at: string;
}

export interface PublicProfileResponse {
  user: PublicProfile;
}
