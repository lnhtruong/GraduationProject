/**
 * Adds heartbeat/resume-watching columns to lesson_progress.
 *   - last_video_position_sec INT NOT NULL DEFAULT 0
 *   - last_watched_at         DATETIME NULL
 *
 * An index on (user_id, last_watched_at DESC) backs the
 * GET /lesson-progress/continue-watching query.
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('lesson_progress');
  if (!hasTable) return;

  const columnExists = async (columnName) => {
    const [rows] = await knex.raw(
      `SELECT COUNT(*) AS c FROM information_schema.columns
       WHERE table_schema = DATABASE() AND table_name = 'lesson_progress' AND column_name = ?`,
      [columnName],
    );
    return Number(rows?.[0]?.c ?? 0) > 0;
  };

  const indexExists = async (indexName) => {
    const [rows] = await knex.raw(
      `SELECT COUNT(*) AS c FROM information_schema.statistics
       WHERE table_schema = DATABASE() AND table_name = 'lesson_progress' AND index_name = ?`,
      [indexName],
    );
    return Number(rows?.[0]?.c ?? 0) > 0;
  };

  if (!(await columnExists('last_video_position_sec'))) {
    await knex.raw(`
      ALTER TABLE lesson_progress
        ADD COLUMN last_video_position_sec INT NOT NULL DEFAULT 0
    `);
  }

  if (!(await columnExists('last_watched_at'))) {
    await knex.raw(`
      ALTER TABLE lesson_progress
        ADD COLUMN last_watched_at DATETIME NULL
    `);
  }

  if (!(await indexExists('idx_lesson_progress_user_watched'))) {
    await knex.raw(`
      CREATE INDEX idx_lesson_progress_user_watched
        ON lesson_progress (user_id, last_watched_at)
    `);
  }
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('lesson_progress');
  if (!hasTable) return;

  const indexExists = async (indexName) => {
    const [rows] = await knex.raw(
      `SELECT COUNT(*) AS c FROM information_schema.statistics
       WHERE table_schema = DATABASE() AND table_name = 'lesson_progress' AND index_name = ?`,
      [indexName],
    );
    return Number(rows?.[0]?.c ?? 0) > 0;
  };

  const columnExists = async (columnName) => {
    const [rows] = await knex.raw(
      `SELECT COUNT(*) AS c FROM information_schema.columns
       WHERE table_schema = DATABASE() AND table_name = 'lesson_progress' AND column_name = ?`,
      [columnName],
    );
    return Number(rows?.[0]?.c ?? 0) > 0;
  };

  if (await indexExists('idx_lesson_progress_user_watched')) {
    await knex.raw(`DROP INDEX idx_lesson_progress_user_watched ON lesson_progress`);
  }

  if (await columnExists('last_watched_at')) {
    await knex.raw(`ALTER TABLE lesson_progress DROP COLUMN last_watched_at`);
  }

  if (await columnExists('last_video_position_sec')) {
    await knex.raw(`ALTER TABLE lesson_progress DROP COLUMN last_video_position_sec`);
  }
};
