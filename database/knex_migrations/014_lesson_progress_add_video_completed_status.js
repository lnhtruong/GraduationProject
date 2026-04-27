/**
 * Adds `video-completed` to lesson_progress.progress enum.
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('lesson_progress');
  if (!hasTable) return;

  await knex.raw(`
    ALTER TABLE lesson_progress
    MODIFY COLUMN progress ENUM('not_started', 'in_progress', 'completed', 'video-completed')
    NOT NULL DEFAULT 'not_started'
  `);
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('lesson_progress');
  if (!hasTable) return;

  await knex.raw(`
    UPDATE lesson_progress
    SET progress = 'completed'
    WHERE progress = 'video-completed'
  `);

  await knex.raw(`
    ALTER TABLE lesson_progress
    MODIFY COLUMN progress ENUM('not_started', 'in_progress', 'completed')
    NOT NULL DEFAULT 'not_started'
  `);
};
