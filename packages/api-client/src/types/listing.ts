/** Matches the Prisma `listings` model */
export interface Listing {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  category: string;
  brand: string | null;
  model: string | null;
  price: string; // Decimal as string
  original_price: string | null;
  currency: string;
  status: string;
  location: string | null;
  is_featured: boolean;
  is_negotiable: boolean;
  views: number;
  favorites_count: number;
  created_at: string;
  updated_at: string;
  ball_condition_type: string | null;
  condition_grip: number | null;
  condition_head: number | null;
  condition_overall: number | null;
  condition_shaft: number | null;
  subcategory: string | null;
  specifications: Record<string, unknown> | null;
  parcel_size: string | null;
  shipping_cost: string | null;
  quantity: number;
}

/** Listing with images included */
export interface ListingWithImages extends Listing {
  images: ListingImage[];
}

/** Matches the Prisma `images` model */
export interface ListingImage {
  id: string;
  listing_id: string;
  image_url: string;
  s3_key: string;
  is_primary: boolean;
  display_order: number;
  alt_text: string | null;
  created_at: string;
}

/** Matches the Prisma `listing_attributes` model */
export interface ListingAttribute {
  id: string;
  listing_id: string;
  key: string;
  value: string;
  created_at: string;
}

export type ListingStatus = 'active' | 'draft' | 'paused' | 'sold' | 'suspended' | 'inactive';