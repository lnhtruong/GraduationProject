/**
 * Extend notifications event_type ENUM để support 3 event của luồng
 * course change request (TT-307):
 *   - course.change_request.approved (báo giảng viên: thay đổi đã được duyệt)
 *   - course.change_request.rejected (báo giảng viên: thay đổi bị từ chối)
 *   - course.updated                 (báo học viên đã enroll: nội dung khóa đổi)
 *
 * 3 type này được thêm trong notification.enums.ts (TypeScript constant) nhưng
 * MySQL ENUM column chưa có → INSERT notification crash với
 * `Data truncated for column 'event_type'`; trước đó DTO @IsEnum trả 400 nên
 * bulk dispatch từ course_service thất bại và noti không tới teacher/student.
 *
 * Replay full enum list (giống pattern migration 041/043) để không phụ thuộc
 * thứ tự áp dụng migration trước. source_type 'course' đã có từ migration cũ.
 */

const NEW_EVENT_TYPES = [
  'course.change_request.approved',
  'course.change_request.rejected',
  'course.updated',
];

const NOTIFICATION_EVENT_TYPES = [
  'feed.comment.created',
  'feed.comment.reply',
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
  // ↓ MỚI (048)
  ...NEW_EVENT_TYPES,
];

const NOTIFICATION_SOURCE_TYPES = [
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
