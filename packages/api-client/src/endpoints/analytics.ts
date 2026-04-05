import { apiClient } from '../client';
import type { SoldOrder } from '../types/order';
import type { ListingWithImages } from '../types/listing';

export interface AnalyticsRawData {
  orders: SoldOrder[];
  listings: ListingWithImages[];
}

/**
 * Fetch raw data for client-side analytics calculation.
 * The backend has no dedicated analytics endpoint — we combine
 * orders and listings data to compute metrics.
 */
export async function fetchAnalyticsData(): Promise<AnalyticsRawData> {
  const [ordersRes, listingsRes] = await Promise.all([
    apiClient.get<{ orders: SoldOrder[] }>('/api/orders/my-sales'),
    apiClient.get<{ listings: ListingWithImages[]; total: number }>(
      '/api/users/my-listings',
      { params: { status: 'all', limit: 100 } }
    ),
  ]);

  return {
    orders: ordersRes.orders || [],
    listings: listingsRes.listings || [],
  };
}
