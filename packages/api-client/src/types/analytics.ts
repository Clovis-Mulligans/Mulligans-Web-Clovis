export type AnalyticsPeriod = '7d' | '30d' | '90d' | '12m';

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface ListingPerformance {
  id: string;
  title: string;
  image: string | null;
  price: string;
  views: number;
  favorites_count: number;
  status: string;
}

export interface AnalyticsSummary {
  total_revenue: number;
  total_orders: number;
  total_views: number;
  avg_order_value: number;
  revenue_change_percent: number;
  orders_change_percent: number;
  views_change_percent: number;
  daily: RevenueDataPoint[];
  top_listings: ListingPerformance[];
}
