const NOTIFICATION_EVENT_TYPES = [
  "feed.comment.created",
  "feed.comment.reply",
  "video.upload.completed",
  "video.job.progress",
  "video.job.failed",
  "video.job.completed",
  "image.upload.completed",
  "lecturer_request.approved",
  "lecturer_request.rejected",
];

const NOTIFICATION_SOURCE_TYPES = [
  "feed_comment",
  "video",
  "video_job",
  "image",
  "lecturer_request",
];

function enumMembersSql(values) {
  return values.map((v) => `'${String(v).replace(/'/g, "''")}'`).join(", ");
}

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable("notifications");
  if (!hasTable) return;

  await knex.raw(`
    ALTER TABLE \`notifications\`
    MODIFY COLUMN \`event_type\` ENUM(${enumMembersSql(NOTIFICATION_EVENT_TYPES)}) NOT NULL,
    MODIFY COLUMN \`source_type\` ENUM(${enumMembersSql(NOTIFICATION_SOURCE_TYPES)}) NULL
  `);
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable("notifications");
  if (!hasTable) return;

  const previousEventTypes = NOTIFICATION_EVENT_TYPES.filter(
    (v) => !v.startsWith("lecturer_request."),
  );
  const previousSourceTypes = NOTIFICATION_SOURCE_TYPES.filter(
    (v) => v !== "lecturer_request",
  );

  await knex.raw(`
    ALTER TABLE \`notifications\`
    MODIFY COLUMN \`event_type\` ENUM(${enumMembersSql(previousEventTypes)}) NOT NULL,
    MODIFY COLUMN \`source_type\` ENUM(${enumMembersSql(previousSourceTypes)}) NULL
  `);
};
