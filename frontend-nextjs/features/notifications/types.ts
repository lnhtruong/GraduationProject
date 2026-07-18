export interface NotificationPayload {
  redirectUrl?: string;
  feedId?: number;
  feed_id?: number;
  videoId?: number;
  video_id?: number;
  courseId?: number;
  course_id?: number;
  lessonId?: number;
  lesson_id?: number;
  url?: string;
  thumbnail?: string;
  thumbnailUrl?: string;
  actor?: {
    id: number;
    name: string;
    avatar?: string;
    [key: string]: unknown;
  } | null;
  actorAvatar?: string;
  [key: string]: unknown;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  event_type: string;
  title: string;
  message: string | null;
  payload: NotificationPayload | null;
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
