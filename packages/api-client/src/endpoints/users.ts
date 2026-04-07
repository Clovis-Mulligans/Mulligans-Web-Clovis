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
