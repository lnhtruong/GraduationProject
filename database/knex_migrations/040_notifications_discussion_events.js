/**
 * BE-04 — extend notifications.event_type and source_type ENUMs to allow
 * the "reply created" notification emitted by the discussion forum.
 *
 * Migration number is intentionally 040 (not 038) because the BE-05 / BE-06
 * Jira cards reserve 038_wishlists.js and 039_instructor_follows.js.
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
];

const NOTIFICATION_SOURCE_TYPES = [
  'feed_comment',
  'video',
  'video_job',
  'image',
  'lecturer_request',
  'discussion_post',
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
    (v) => !v.startsWith('discussion.'),
  );
  const previousSourceTypes = NOTIFICATION_SOURCE_TYPES.filter(
    (v) => v !== 'discussion_post',
  );

  await knex.raw(`
    ALTER TABLE \`notifications\`
    MODIFY COLUMN \`event_type\` ENUM(${enumMembersSql(previousEventTypes)}) NOT NULL,
    MODIFY COLUMN \`source_type\` ENUM(${enumMembersSql(previousSourceTypes)}) NULL
  `);
};
