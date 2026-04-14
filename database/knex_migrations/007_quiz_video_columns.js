/**
 * Align quizzes / quiz_questions with Sequelize models:
 * - quizzes.is_in_video
 * - quiz_questions.video_timestamp
 */
exports.up = async function (knex) {
  if (!(await knex.schema.hasTable("quizzes"))) return;
  if (!(await knex.schema.hasTable("quiz_questions"))) return;

  const [quizColRows] = await knex.raw(
    `SELECT COUNT(*) AS c FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'quizzes' AND column_name = 'is_in_video'`,
  );
  if (Number(quizColRows?.[0]?.c ?? 0) === 0) {
    await knex.raw(
      `ALTER TABLE quizzes ADD COLUMN is_in_video BOOLEAN NOT NULL DEFAULT FALSE AFTER time_limit_minutes`,
    );
  }

  const [qColRows] = await knex.raw(
    `SELECT COUNT(*) AS c FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'quiz_questions' AND column_name = 'video_timestamp'`,
  );
  if (Number(qColRows?.[0]?.c ?? 0) === 0) {
    await knex.raw(
      `ALTER TABLE quiz_questions ADD COLUMN video_timestamp TIME NULL AFTER order_index`,
    );
  }
};

exports.down = async function (knex) {
  const hasQuizzes = await knex.schema.hasTable("quizzes");
  if (hasQuizzes) {
    try {
      await knex.raw(`ALTER TABLE quizzes DROP COLUMN is_in_video`);
    } catch (e) {
      const msg = String(e?.message ?? e);
      if (
        !msg.includes("check that column/key exists") &&
        !msg.includes("Unknown column")
      ) {
        throw e;
      }
    }
  }

  const hasQQ = await knex.schema.hasTable("quiz_questions");
  if (hasQQ) {
    try {
      await knex.raw(`ALTER TABLE quiz_questions DROP COLUMN video_timestamp`);
    } catch (e) {
      const msg = String(e?.message ?? e);
      if (
        !msg.includes("check that column/key exists") &&
        !msg.includes("Unknown column")
      ) {
        throw e;
      }
    }
  }
};
