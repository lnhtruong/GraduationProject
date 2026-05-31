/**
 * Migrate lesson_progress watch position from integer seconds to integer
 * milliseconds to remove the ~1s rounding drift on resume.
 *
 *   last_video_position_sec INT  ->  last_video_position_ms INT
 *
 * Existing values are converted (sec * 1000). INT max (~2.1e9 ms ≈ 24 days)
 * comfortably covers any lesson video length.
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

  if (await columnExists('last_video_position_ms')) {
    return; // already migrated
  }

  await knex.raw(`
    ALTER TABLE lesson_progress
      ADD COLUMN last_video_position_ms INT NOT NULL DEFAULT 0
  `);

  if (await columnExists('last_video_position_sec')) {
    await knex.raw(`
      UPDATE lesson_progress
        SET last_video_position_ms = last_video_position_sec * 1000
    `);
    await knex.raw(`
      ALTER TABLE lesson_progress DROP COLUMN last_video_position_sec
    `);
  }
};

exports.down = async function (knex) {
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

  if (await columnExists('last_video_position_sec')) {
    return; // already reverted
  }

  await knex.raw(`
    ALTER TABLE lesson_progress
      ADD COLUMN last_video_position_sec INT NOT NULL DEFAULT 0
  `);

  if (await columnExists('last_video_position_ms')) {
    await knex.raw(`
      UPDATE lesson_progress
        SET last_video_position_sec = ROUND(last_video_position_ms / 1000)
    `);
    await knex.raw(`
      ALTER TABLE lesson_progress DROP COLUMN last_video_position_ms
    `);
  }
};
