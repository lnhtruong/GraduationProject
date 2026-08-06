/**
 * Add a dedicated learner-facing explanation column to quiz questions.
 *
 * Migration 053 may already have been applied locally on this feature branch,
 * so this separate idempotent migration makes existing local databases catch up
 * without editing a migration that Knex has already recorded as executed.
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('quiz_questions');
  if (!hasTable) return;

  const [rows] = await knex.raw(
    `SELECT COUNT(*) AS c FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'quiz_questions' AND column_name = 'explanation'`,
  );

  if (Number(rows?.[0]?.c ?? 0) === 0) {
    await knex.raw(
      `ALTER TABLE \`quiz_questions\` ADD COLUMN explanation TEXT NULL AFTER correct_ans`,
    );
  }
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('quiz_questions');
  if (!hasTable) return;

  try {
    await knex.raw(`ALTER TABLE \`quiz_questions\` DROP COLUMN explanation`);
  } catch (e) {
    const msg = String(e?.message ?? e);
    if (!msg.includes('check that column/key exists') && !msg.includes('Unknown column')) {
      throw e;
    }
  }
};
