exports.up = async function (knex) {
  const hasDeletedAt = await knex.schema.hasColumn('reports', 'deleted_at');
  if (!hasDeletedAt) {
    await knex.raw(`
      ALTER TABLE reports
        ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL,
        ADD INDEX idx_reports_deleted_at (deleted_at);
    `);
  }
};

exports.down = async function (knex) {
  const hasDeletedAt = await knex.schema.hasColumn('reports', 'deleted_at');
  if (hasDeletedAt) {
    await knex.raw(`ALTER TABLE reports DROP INDEX idx_reports_deleted_at;`);
    await knex.raw(`ALTER TABLE reports DROP COLUMN deleted_at;`);
  }
};
