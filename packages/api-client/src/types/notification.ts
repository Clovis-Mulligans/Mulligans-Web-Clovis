// Mirrors the shape returned by src/routes/notificationRoutes.ts on the backend.
// Matches the mobile Notification type in app/(tabs)/activity.tsx.

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  image_url: string | null;
  related_user_avatar: string | null;
  related_user_name: string | null;
  created_at: string;
  is_read: boolean;
  related_id: string | null;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unread_count: number;
}
