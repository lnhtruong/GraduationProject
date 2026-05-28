/**
 * BE-07 — extend notifications ENUMs to support follow / publish-by-followed
 * events emitted by the follow feature.
 *
 * Replays the full enum list so it is independent of whether 040_*
 * (BE-04 discussion events) has been applied.
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
    (v) => !v.startsWith('instructor.follow.') && !v.startsWith('course.publish.'),
  );
  const previousSourceTypes = NOTIFICATION_SOURCE_TYPES.filter(
    (v) => v !== 'instructor_follow' && v !== 'course',
  );

  await knex.raw(`
    ALTER TABLE \`notifications\`
    MODIFY COLUMN \`event_type\` ENUM(${enumMembersSql(previousEventTypes)}) NOT NULL,
    MODIFY COLUMN \`source_type\` ENUM(${enumMembersSql(previousSourceTypes)}) NULL
  `);
};
