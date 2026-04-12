import { apiClient } from '../client';
import type { PublicProfileResponse } from '../types/userPublic';
import type { User } from '../types/user';

/** GET /api/users/:userId — public profile */
export function getPublicProfile(userId: string) {
  return apiClient.get<PublicProfileResponse>(`/api/users/${userId}`);
}

/** PUT /api/users/me — update own profile (requires auth) */
export function updateMyProfile(data: Partial<User>) {
  return apiClient.put<{ user: User }>('/api/users/me', data);
}

/** POST /api/users/me/avatar — upload avatar (FormData, requires auth) */
export async function uploadAvatar(file: File): Promise<{ avatar_url: string }> {
  const formData = new FormData();
  formData.append('avatar', file);

  const baseUrl = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL || 'https://api.mulligans.uk.com')
    : 'https://api.mulligans.uk.com';
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('mulligans_auth_token')
    : null;

  const res = await fetch(`${baseUrl}/api/users/me/avatar`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || `Upload failed (${res.status})`);
  }

  return res.json();
}

// ─── NEW: Brief 6I additions ─────────────────────────────────────

export interface UserStats {
  sales: number;
  rating: number;
  reviewCount: number;
  memberSince: number;
  last30DaysEarnings: number;
  potentialRevenue: number;
  activeListingsCount: number;
}

export interface SellerStats {
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  yearEarnings: number;
  allTimeEarnings: number;
  ordersToShip: number;
  totalViews: number;
  totalFavorites: number;
}

export interface UserListingsParams {
  page?: number;
  limit?: number;
  status?: string;
  sort?: string;
  search?: string;
  category?: string;
  subcategory?: string;
}

export interface UserListingsResponse {
  listings: any[];
  total: number;
  user?: any;
  categories?: string[];
}

export interface SoldItemsResponse {
  items: any[];
}

/** GET /api/users/:userId/stats — public user stats */
export function getUserStats(userId: string) {
  return apiClient.get<UserStats>(`/api/users/${userId}/stats`);
}

/** GET /api/users/:userId/seller-stats — seller dashboard stats */
export function getSellerStats(userId: string) {
  return apiClient.get<SellerStats>(`/api/users/${userId}/seller-stats`);
}

/** GET /api/users/:userId/listings — public user listings (paginated) */
export function getUserListings(userId: string, params?: UserListingsParams) {
  return apiClient.get<UserListingsResponse>(`/api/users/${userId}/listings`, {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

/** GET /api/users/:userId/sold-items — sold items for a user */
export function getUserSoldItems(userId: string) {
  return apiClient.get<SoldItemsResponse>(`/api/users/${userId}/sold-items`);
}

/** POST /api/users/report — report a user (requires auth) */
export function reportUser(data: {
  reported_user_id: string;
  reason: string;
  details?: string;
}) {
  return apiClient.post<{ success: boolean; message: string; report_id: number }>(
    '/api/users/report',
    data
  );
}

/** POST /api/users/:id/block — block a user (requires auth) */
export function blockUser(userId: string) {
  return apiClient.post<{ success: boolean; message: string }>(
    `/api/users/${userId}/block`
  );
}

/** DELETE /api/users/:id/block — unblock a user (requires auth) */
export function unblockUser(userId: string) {
  return apiClient.delete<{ success: boolean; message: string }>(
    `/api/users/${userId}/block`
  );
}

/** GET /api/users/:id/blocked — check if user is blocked (requires auth) */
export function isUserBlocked(userId: string) {
  return apiClient.get<{ is_blocked: boolean }>(
    `/api/users/${userId}/blocked`
  );
}
