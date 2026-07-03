/**
 * Videos: optional upload context for async provider webhooks.
 *
 * Bunny Stream webhooks only include the provider video GUID. We persist local
 * context at init-upload time so the completion notification can route users
 * back to the course/lesson page. Nullable/default NULL keeps existing seed
 * data and old uploads compatible.
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('videos');
  if (!hasTable) return;

  const hasColumn = await knex.schema.hasColumn('videos', 'upload_context');
  if (hasColumn) return;

  await knex.schema.alterTable('videos', (table) => {
    table.json('upload_context').nullable().defaultTo(null).after('srt_raw_url');
  });
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('videos');
  if (!hasTable) return;

  const hasColumn = await knex.schema.hasColumn('videos', 'upload_context');
  if (!hasColumn) return;

  await knex.schema.alterTable('videos', (table) => {
    table.dropColumn('upload_context');
  });
};
