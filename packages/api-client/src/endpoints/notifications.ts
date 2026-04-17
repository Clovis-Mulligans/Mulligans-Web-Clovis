import { apiClient } from '../client';
import type { NotificationsResponse, Notification } from '../types/notification';

/** GET /api/notifications — list the current user's 50 most recent notifications. */
export function getNotifications() {
  return apiClient.get<NotificationsResponse>('/api/notifications');
}

/** PATCH /api/notifications/:id/read — mark a single notification as read. */
export function markNotificationRead(id: string) {
  return apiClient.patch<Notification>(`/api/notifications/${id}/read`);
}

/** PATCH /api/notifications/read-all — mark every unread notification as read. */
export function markAllNotificationsRead() {
  return apiClient.patch<{ success: boolean }>('/api/notifications/read-all');
}
