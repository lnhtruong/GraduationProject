/**
 * Extend notifications event_type ENUM để support event của luồng
 * highlight segment removal (spec 003-highlight-segment-removal):
 *   - highlight_edit.completed (báo user: đã bỏ đoạn xong, highlight đã cập nhật)
 *
 * Không thêm highlight_edit.failed — lỗi tái dùng cặp generic
 * video.job.failed/VIDEO_ERROR sẵn có, giống mọi job type khác (xem
 * `case 'job_failed'` trong webhook.service.ts).
 *
 * Replay full enum list (giống pattern migration 041/043/048/051) để không
 * phụ thuộc thứ tự áp dụng migration trước.
 */

const NEW_EVENT_TYPES = ['highlight_edit.completed'];

const NOTIFICATION_EVENT_TYPES = [
  'feed.comment.created',
  'feed.comment.reply',
  'feed.like.created',
  'video.upload.completed',
  'video.job.progress',
  'video.job.failed',
  'video.job.completed',
  'image.upload.completed',
  'lecturer_request.approved',
  'lecturer_request.rejected',
  'discussion.reply.created',
  'instructor.follow.new',
  'course.publish.new_from_instructor',
  'transcribe.completed',
  'quiz.generated',
  'course.change_request.approved',
  'course.change_request.rejected',
  'course.updated',
  ...NEW_EVENT_TYPES,
];

const NOTIFICATION_SOURCE_TYPES = [
  'feed',
  'feed_comment',
  'video',
  'video_job',
  'image',
  'lecturer_request',
  'discussion_post',
  'instructor_follow',
  'course',
];

function enumMembersSql(values) {
  return values.map((v) => `'${String(v).replace(/'/g, "''")}'`).join(', ');
}

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('notifications');
  if (!hasTable) return;

  await knex.raw(`
    ALTER TABLE \`notifications\`
    MODIFY COLUMN \`event_type\` ENUM(${enumMembersSql(NOTIFICATION_EVENT_TYPES)}) NOT NULL,
    MODIFY COLUMN \`source_type\` ENUM(${enumMembersSql(NOTIFICATION_SOURCE_TYPES)}) NULL
  `);
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('notifications');
  if (!hasTable) return;

  const previousEventTypes = NOTIFICATION_EVENT_TYPES.filter(
    (v) => !NEW_EVENT_TYPES.includes(v),
  );

  await knex.raw(`
    ALTER TABLE \`notifications\`
    MODIFY COLUMN \`event_type\` ENUM(${enumMembersSql(previousEventTypes)}) NOT NULL,
    MODIFY COLUMN \`source_type\` ENUM(${enumMembersSql(NOTIFICATION_SOURCE_TYPES)}) NULL
  `);
};
