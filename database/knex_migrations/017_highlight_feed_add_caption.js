/**
 * Add 'caption' column to the 'highlight_feed' table.
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('highlight_feed');
  if (!hasTable) return;

  const hasColumn = await knex.schema.hasColumn('highlight_feed', 'caption');
  if (hasColumn) return;

  return knex.schema.alterTable('highlight_feed', function (table) {
    table.text('caption').nullable();
  });
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('highlight_feed');
  if (!hasTable) return;

  const hasColumn = await knex.schema.hasColumn('highlight_feed', 'caption');
  if (!hasColumn) return;

  return knex.schema.alterTable('highlight_feed', function (table) {
    table.dropColumn('caption');
  });
};
