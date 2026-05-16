export interface NotificationItem {
  id: number;
  user_id: number;
  event_type: string;
  title: string;
  message: string | null;
  payload: Record<string, unknown> | null;
  is_read: boolean;
  source_type: string | null;
  source_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationListResponse {
  data: NotificationItem[];
  next_cursor: number | null;
}

export interface BulkUpdateNotificationsPayload {
  is_read: boolean;
  all?: boolean;
  ids?: number[];
}

export interface PatchNotificationPayload {
  is_read: boolean;
}
