/**
 * Adds an optional course thumbnail URL.
 *
 * The value can point to a stored mascot_images.url or any public image URL.
 * No foreign key is used because the product explicitly allows external URLs.
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable("courses");
  if (!hasTable) return;

  const hasColumn = await knex.schema.hasColumn("courses", "thumbnail_url");
  if (hasColumn) return;

  await knex.raw(`
      ALTER TABLE courses
      ADD COLUMN thumbnail_url TEXT NULL
    `);
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable("courses");
  if (!hasTable) return;

  const hasColumn = await knex.schema.hasColumn("courses", "thumbnail_url");
  if (!hasColumn) return;

  await knex.raw(`
      ALTER TABLE courses
      DROP COLUMN thumbnail_url
    `);
};
