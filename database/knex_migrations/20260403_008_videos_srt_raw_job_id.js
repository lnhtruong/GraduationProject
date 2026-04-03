const { hasColumn, hasIndex, isColumnNullable } = require("./_legacy_sql");

/**
 * Legacy 008:
 * - videos.job_id + index
 * - allow videos.url be NULL (modify column)
 */
exports.up = async function (knex) {
  const hasJobId = await hasColumn(knex, "videos", "job_id");
  const urlIsNullable = await isColumnNullable(knex, "videos", "url");

  if (!hasJobId) {
    await knex.raw(
      "ALTER TABLE `videos` ADD COLUMN `job_id` VARCHAR(255) NULL;",
    );
    await knex.raw("CREATE INDEX `idx_videos_job_id` ON `videos` (`job_id`);");
  } else {
    const hasVideosJobIdIndex = await hasIndex(
      knex,
      "videos",
      "idx_videos_job_id",
    );
    if (!hasVideosJobIdIndex) {
      await knex.raw(
        "CREATE INDEX `idx_videos_job_id` ON `videos` (`job_id`);",
      );
    }
  }

  if (!urlIsNullable) {
    await knex.raw("ALTER TABLE `videos` MODIFY COLUMN `url` TEXT NULL;");
  }
};

exports.down = async function (knex) {
  // Không auto rollback cho migration legacy này.
};
