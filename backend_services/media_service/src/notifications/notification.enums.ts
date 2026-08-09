export const NotificationEventType = {
  FEED_COMMENT_CREATED: 'feed.comment.created',
  FEED_COMMENT_REPLY: 'feed.comment.reply',
  FEED_LIKE_CREATED: 'feed.like.created',
  VIDEO_UPLOAD_COMPLETED: 'video.upload.completed',
  VIDEO_JOB_PROGRESS: 'video.job.progress',
  VIDEO_JOB_FAILED: 'video.job.failed',
  VIDEO_JOB_COMPLETED: 'video.job.completed',
  TRANSCRIBE_COMPLETED: 'transcribe.completed',
  QUIZ_GENERATED: 'quiz.generated',
  IMAGE_UPLOAD_COMPLETED: 'image.upload.completed',
  LECTURER_REQUEST_APPROVED: 'lecturer_request.approved',
  LECTURER_REQUEST_REJECTED: 'lecturer_request.rejected',
  DISCUSSION_REPLY_CREATED: 'discussion.reply.created',
  INSTRUCTOR_FOLLOW_NEW: 'instructor.follow.new',
  COURSE_PUBLISH_NEW_FROM_INSTRUCTOR: 'course.publish.new_from_instructor',
  COURSE_CHANGE_REQUEST_APPROVED: 'course.change_request.approved',
  COURSE_CHANGE_REQUEST_REJECTED: 'course.change_request.rejected',
  COURSE_UPDATED: 'course.updated',
  // No HIGHLIGHT_EDIT_FAILED — failures reuse the existing generic
  // VIDEO_JOB_FAILED/VIDEO_ERROR pair, same as every other job type
  // (see the `case 'job_failed'` handling in webhook.service.ts).
  HIGHLIGHT_EDIT_COMPLETED: 'highlight_edit.completed',
} as const;

export type NotificationEventType =
  (typeof NotificationEventType)[keyof typeof NotificationEventType];


export const NotificationSourceType = {
  FEED: 'feed',
  FEED_COMMENT: 'feed_comment',
  VIDEO: 'video',
  VIDEO_JOB: 'video_job',
  IMAGE: 'image',
  LECTURER_REQUEST: 'lecturer_request',
  DISCUSSION_POST: 'discussion_post',
  INSTRUCTOR_FOLLOW: 'instructor_follow',
  COURSE: 'course',
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
  TRANSCRIBE_COMPLETED: 'transcribe:completed',
  QUIZ_GENERATED: 'quiz:generated',
  NOTIFY_LECTURER_REQUEST: 'notify:lecturer-request',
} as const;

export type NotificationSseEventType =
  (typeof NotificationSseEventType)[keyof typeof NotificationSseEventType];


export const NOTIFICATION_EVENT_TYPE_MYSQL_ENUM = [
  NotificationEventType.FEED_COMMENT_CREATED,
  NotificationEventType.FEED_COMMENT_REPLY,
  NotificationEventType.FEED_LIKE_CREATED,
  NotificationEventType.VIDEO_UPLOAD_COMPLETED,
  NotificationEventType.VIDEO_JOB_PROGRESS,
  NotificationEventType.VIDEO_JOB_FAILED,
  NotificationEventType.VIDEO_JOB_COMPLETED,
  NotificationEventType.TRANSCRIBE_COMPLETED,
  NotificationEventType.QUIZ_GENERATED,
  NotificationEventType.IMAGE_UPLOAD_COMPLETED,
  NotificationEventType.LECTURER_REQUEST_APPROVED,
  NotificationEventType.LECTURER_REQUEST_REJECTED,
  NotificationEventType.DISCUSSION_REPLY_CREATED,
  NotificationEventType.INSTRUCTOR_FOLLOW_NEW,
  NotificationEventType.COURSE_PUBLISH_NEW_FROM_INSTRUCTOR,
  NotificationEventType.COURSE_CHANGE_REQUEST_APPROVED,
  NotificationEventType.COURSE_CHANGE_REQUEST_REJECTED,
  NotificationEventType.COURSE_UPDATED,
  NotificationEventType.HIGHLIGHT_EDIT_COMPLETED,
] as const;

export const NOTIFICATION_SOURCE_TYPE_MYSQL_ENUM = [
  NotificationSourceType.FEED,
  NotificationSourceType.FEED_COMMENT,
  NotificationSourceType.VIDEO,
  NotificationSourceType.VIDEO_JOB,
  NotificationSourceType.IMAGE,
  NotificationSourceType.LECTURER_REQUEST,
  NotificationSourceType.DISCUSSION_POST,
  NotificationSourceType.INSTRUCTOR_FOLLOW,
  NotificationSourceType.COURSE,
] as const;
