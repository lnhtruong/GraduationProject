const { hasColumn, hasIndex } = require("./_legacy_sql");

/**
 * Legacy 007:
 * - videos.srt_raw_url
 * - lessons.video_id (+ index)
 */
exports.up = async function (knex) {
  const hasSrtRawUrl = await hasColumn(knex, "videos", "srt_raw_url");
  const hasLessonsVideoId = await hasColumn(knex, "lessons", "video_id");

  if (!hasSrtRawUrl) {
    await knex.raw("ALTER TABLE `videos` ADD COLUMN `srt_raw_url` TEXT NULL;");
  }

  if (!hasLessonsVideoId) {
    await knex.raw(
      "ALTER TABLE `lessons` ADD COLUMN `video_id` INT NULL, ADD INDEX `idx_lessons_video_id` (`video_id`);",
    );
  } else {
    const hasLessonsVideoIdIndex = await hasIndex(
      knex,
      "lessons",
      "idx_lessons_video_id",
    );
    if (!hasLessonsVideoIdIndex) {
      await knex.raw(
        "CREATE INDEX `idx_lessons_video_id` ON `lessons` (`video_id`);",
      );
    }
  }
};

exports.down = async function (knex) {
  // Migration này không auto rollback (legacy ALTER TABLE không idempotent down).
};
