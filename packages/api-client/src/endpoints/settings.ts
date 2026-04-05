import { apiClient } from '../client';
import type { ProStoreSettings, UpdateSettingsData } from '../types/settings';

/** GET /api/users/me — current user profile / settings */
export function getSettings() {
  return apiClient.get<ProStoreSettings>('/api/users/me');
}

/** PUT /api/users/me — update user settings */
export function updateSettings(data: UpdateSettingsData) {
  return apiClient.put<ProStoreSettings>('/api/users/me', data);
}

/**
 * POST /api/users/:userId/avatar — upload avatar image.
 * Uses multipart/form-data, not JSON.
 */
export async function uploadAvatar(userId: string, file: File): Promise<ProStoreSettings> {
  const formData = new FormData();
  formData.append('avatar', file);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.mulligans.uk.com';
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('mulligans_auth_token')
      : null;

  const res = await fetch(`${baseUrl}/api/users/${userId}/avatar`, {
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
