/**
 * Soft delete cho quiz / quiz_questions / quiz_options.
 *
 * Lý do: giảng viên submit /generate-quiz AI sinh ra N câu hỏi, sau đó
 * muốn lọc chỉ giữ lại M < N câu. Hard delete sẽ mất câu hỏi không khôi
 * phục được — soft delete cho phép restore + audit history.
 *
 * Sequelize paranoid mode mặc định dùng cột `deleted_at` (timestamp NULL).
 *
 * Idempotent: kiểm tra cột tồn tại trước khi ALTER (theo pattern các
 * migration đã có như 007).
 */
exports.up = async function (knex) {
  const tables = ['quizzes', 'quiz_questions', 'quiz_options'];
  for (const table of tables) {
    if (!(await knex.schema.hasTable(table))) continue;
    const [rows] = await knex.raw(
      `SELECT COUNT(*) AS c FROM information_schema.columns
       WHERE table_schema = DATABASE() AND table_name = ? AND column_name = 'deleted_at'`,
      [table],
    );
    if (Number(rows?.[0]?.c ?? 0) === 0) {
      await knex.raw(
        `ALTER TABLE \`${table}\` ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL`,
      );
      // Index để filter "active rows" nhanh — paranoid mode hay query WHERE deleted_at IS NULL
      await knex.raw(
        `ALTER TABLE \`${table}\` ADD INDEX idx_${table}_deleted_at (deleted_at)`,
      );
    }
  }
};

exports.down = async function (knex) {
  const tables = ['quiz_options', 'quiz_questions', 'quizzes']; // reverse order
  for (const table of tables) {
    if (!(await knex.schema.hasTable(table))) continue;
    try {
      await knex.raw(`ALTER TABLE \`${table}\` DROP INDEX idx_${table}_deleted_at`);
    } catch (e) {
      const msg = String(e?.message ?? e);
      if (!msg.includes('check that column/key exists') && !msg.includes('not exist')) {
        throw e;
      }
    }
    try {
      await knex.raw(`ALTER TABLE \`${table}\` DROP COLUMN deleted_at`);
    } catch (e) {
      const msg = String(e?.message ?? e);
      if (!msg.includes('check that column/key exists') && !msg.includes('Unknown column')) {
        throw e;
      }
    }
  }
};
