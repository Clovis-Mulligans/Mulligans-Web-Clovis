/**
 * Cart & Checkout API functions.
 * Separate file to avoid modifying the shared api-client package.
 * Uses the same auth token pattern as the rest of the app.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mulligans.uk.com';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mulligans_auth_token');
}

async function authFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let data: any;
    try { data = await res.json(); } catch {}
    throw { status: res.status, message: data?.error || res.statusText, data };
  }

  if (res.status === 204) return undefined;
  return res.json();
}

// ─── Cart ─────────────────────────────────────────────

export interface CartSeller {
  seller_id: string;
  seller_name: string;
  seller_avatar: string | null;
  seller_rating: number;
  seller_is_verified_seller_seller: boolean;
  items: CartItem[];
  subtotal: number;
  shipping_cost: number;
  is_pro_store: boolean;
  pro_store_name: string | null;
}

export interface CartItem {
  id: string;
  listing_id: string;
  title: string;
  price: number;
  quantity: number;
  selected_size: string | null;
  line_total: number;
  available_stock: number;
  shipping_cost: number;
  image_url: string | null;
  parcel_size: string;
  added_at: string;
  expires_at: string;
  is_available: boolean;
  in_other_carts: boolean;
  offer_id: string | null;
  offer_price: number | null;
  offer_expires_at: string | null;
  condition_overall: number | null;
}

export interface CartSummary {
  items_total: number;
  base_shipping: number;
  insurance_premium: number;
  insured_shipping_total: number;
  buyer_protection_fee: number;
  grand_total: number;
  item_count: number;
}

export interface CartResponse {
  sellers: CartSeller[];
  summary: CartSummary;
  warnings: { listing_id: string; message: string }[];
  unavailable_items: { listing_id: string; title: string; message: string }[];
}

export async function getCart(): Promise<CartResponse> {
  return authFetch('/api/cart/');
}

export async function removeFromCart(listingId: string, selectedSize?: string | null): Promise<void> {
  const qs = selectedSize ? `?selected_size=${encodeURIComponent(selectedSize)}` : '';
  return authFetch(`/api/cart/${listingId}${qs}`, { method: 'DELETE' });
}

export async function clearCart(): Promise<void> {
  return authFetch('/api/cart/', { method: 'DELETE' });
}

// ─── Checkout ─────────────────────────────────────────

export interface CheckoutSession {
  sessionId: string;
  url: string;
  summary: {
    itemCount: number;
    totalQuantity: number;
    itemsTotal: string;
    baseShipping: string;
    insurancePremium: string;
    insuredShippingTotal: string;
    platformFee: string;
    grandTotal: string;
  };
}

export async function createCartCheckout(): Promise<CheckoutSession> {
  return authFetch('/api/stripe/create-cart-checkout', { method: 'POST' });
}

// ─── Orders (for confirmation page) ──────────────────

export async function getMyRecentPurchases(): Promise<any> {
  return authFetch('/api/orders/my-purchases?limit=10');
}
