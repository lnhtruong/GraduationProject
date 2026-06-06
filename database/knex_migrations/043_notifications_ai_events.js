/**
 * Extend notifications event_type ENUM để support 2 event AI mới:
 *   - transcribe.completed (Whisper SRT done)
 *   - quiz.generated       (Quiz đã sinh từ OpenAI)
 *
 * 2 type này được thêm trong notification.enums.ts (TypeScript constant) nhưng
 * MySQL ENUM column chưa có giá trị tương ứng → INSERT notification crash với
 * `Data truncated for column 'event_type'` → webhook QStash trả 500.
 *
 * Replay full enum list (giống pattern migration 041) để không phụ thuộc
 * thứ tự áp dụng migration trước.
 */

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
  // ↓ MỚI (043)
  'transcribe.completed',
  'quiz.generated',
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
    (v) => v !== 'transcribe.completed' && v !== 'quiz.generated',
  );

  await knex.raw(`
    ALTER TABLE \`notifications\`
    MODIFY COLUMN \`event_type\` ENUM(${enumMembersSql(previousEventTypes)}) NOT NULL,
    MODIFY COLUMN \`source_type\` ENUM(${enumMembersSql(NOTIFICATION_SOURCE_TYPES)}) NULL
  `);
};
