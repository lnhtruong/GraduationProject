export const NotificationEventType = {
  FEED_COMMENT_CREATED: 'feed.comment.created',
  FEED_COMMENT_REPLY: 'feed.comment.reply',
  VIDEO_UPLOAD_COMPLETED: 'video.upload.completed',
  VIDEO_JOB_PROGRESS: 'video.job.progress',
  VIDEO_JOB_FAILED: 'video.job.failed',
  VIDEO_JOB_COMPLETED: 'video.job.completed',
  IMAGE_UPLOAD_COMPLETED: 'image.upload.completed',
} as const;

export type NotificationEventType =
  (typeof NotificationEventType)[keyof typeof NotificationEventType];


export const NotificationSourceType = {
  FEED_COMMENT: 'feed_comment',
  VIDEO: 'video',
  VIDEO_JOB: 'video_job',
  IMAGE: 'image',
} as const;

export type NotificationSourceType =
  (typeof NotificationSourceType)[keyof typeof NotificationSourceType];

export const NotificationSseEventType = {
  NOTIFY_CREATED: 'notify:created',
  UPLOAD_VIDEO_COMPLETED: 'upload-video:completed',
  UPLOAD_IMAGE_COMPLETED: 'upload-image:completed',
  VIDEO_PROGRESS: 'video:progress',
  VIDEO_ERROR: 'video:error',
  VIDEO_COMPLETED: 'video:completed',
} as const;

export type NotificationSseEventType =
  (typeof NotificationSseEventType)[keyof typeof NotificationSseEventType];


export const NOTIFICATION_EVENT_TYPE_MYSQL_ENUM = [
  NotificationEventType.FEED_COMMENT_CREATED,
  NotificationEventType.FEED_COMMENT_REPLY,
  NotificationEventType.VIDEO_UPLOAD_COMPLETED,
  NotificationEventType.VIDEO_JOB_PROGRESS,
  NotificationEventType.VIDEO_JOB_FAILED,
  NotificationEventType.VIDEO_JOB_COMPLETED,
  NotificationEventType.IMAGE_UPLOAD_COMPLETED,
] as const;

export const NOTIFICATION_SOURCE_TYPE_MYSQL_ENUM = [
  NotificationSourceType.FEED_COMMENT,
  NotificationSourceType.VIDEO,
  NotificationSourceType.VIDEO_JOB,
  NotificationSourceType.IMAGE,
] as const;
