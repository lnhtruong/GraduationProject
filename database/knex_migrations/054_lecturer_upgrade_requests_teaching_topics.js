exports.up = async function (knex) {
  const hasTeachingTopics = await knex.schema.hasColumn(
    'lecturer_upgrade_requests',
    'teaching_topics',
  );
  if (!hasTeachingTopics) {
    await knex.raw(`
      ALTER TABLE lecturer_upgrade_requests
      ADD COLUMN teaching_topics VARCHAR(255) NULL AFTER confirm
    `);
  }

  const hasReportCategory = await knex.schema.hasColumn('reports', 'report_category');
  if (!hasReportCategory) {
    await knex.raw(`
      ALTER TABLE reports
      ADD COLUMN report_category VARCHAR(64) NULL AFTER target_id
    `);
  }
};

exports.down = async function (knex) {
  const hasReportCategory = await knex.schema.hasColumn('reports', 'report_category');
  if (hasReportCategory) {
    await knex.raw('ALTER TABLE reports DROP COLUMN report_category');
  }

  const hasTeachingTopics = await knex.schema.hasColumn(
    'lecturer_upgrade_requests',
    'teaching_topics',
  );
  if (hasTeachingTopics) {
    await knex.raw('ALTER TABLE lecturer_upgrade_requests DROP COLUMN teaching_topics');
  }
};