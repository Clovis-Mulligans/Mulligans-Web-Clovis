import { apiClient } from '../client';
import type { CartResponse, CartItem, AddToCartData } from '../types/cart';

/** GET /api/cart — get cart items */
export function getCart() {
  return apiClient.get<CartResponse>('/api/cart');
}

/** GET /api/cart/count — get cart item count */
export function getCartCount() {
  return apiClient.get<{ count: number }>('/api/cart/count');
}

/** POST /api/cart/add — add item to cart */
export function addToCart(data: AddToCartData) {
  return apiClient.post<{ message: string; item: CartItem }>('/api/cart/add', data);
}

/** DELETE /api/cart/:listingId — remove item from cart */
export function removeFromCart(listingId: string) {
  return apiClient.delete<{ message: string }>(`/api/cart/${listingId}`);
}

/** PUT /api/cart/quantity/:listingId — update quantity */
export function updateCartQuantity(listingId: string, quantity: number) {
  return apiClient.put<{ message: string }>(`/api/cart/quantity/${listingId}`, { quantity });
}

/** DELETE /api/cart — clear entire cart */
export function clearCart() {
  return apiClient.delete<{ message: string }>('/api/cart');
}
