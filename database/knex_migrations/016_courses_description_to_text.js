/**
 * Change courses.description from VARCHAR(255) to TEXT.
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('courses');
  if (!hasTable) return;

  const hasColumn = await knex.schema.hasColumn('courses', 'description');
  if (!hasColumn) return;

  await knex.raw(`
    ALTER TABLE courses
    MODIFY COLUMN description TEXT NULL
  `);
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('courses');
  if (!hasTable) return;

  const hasColumn = await knex.schema.hasColumn('courses', 'description');
  if (!hasColumn) return;

  await knex.raw(`
    ALTER TABLE courses
    MODIFY COLUMN description VARCHAR(255) NULL
  `);
};
