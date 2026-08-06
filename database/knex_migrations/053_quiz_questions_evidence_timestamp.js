/**
 * Tách evidence_timestamp khỏi video_timestamp trên quiz_questions.
 *
 * Lý do: video_timestamp trước đây bị dùng chung cho 2 khái niệm khác nhau —
 * mốc hiển thị quiz trong video (trigger point, chỉ có ý nghĩa khi
 * quizzes.is_in_video = true) và mốc bằng chứng chứng minh đáp án do AI sinh
 * ra (evidence, có ý nghĩa với mọi loại quiz). Khi 2 giá trị này khác nhau,
 * không có chỗ lưu độc lập — evidence bị ép trùng trigger point.
 *
 * Cột mới luôn optional, không phụ thuộc is_in_video (khác video_timestamp).
 *
 * Idempotent: kiểm tra cột tồn tại trước khi ALTER (theo pattern 042/023).
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('quiz_questions');
  if (!hasTable) return;

  const [rows] = await knex.raw(
    `SELECT COUNT(*) AS c FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'quiz_questions' AND column_name = 'evidence_timestamp'`,
  );
  if (Number(rows?.[0]?.c ?? 0) === 0) {
    await knex.raw(
      `ALTER TABLE \`quiz_questions\` ADD COLUMN evidence_timestamp TIME(3) NULL AFTER video_timestamp`,
    );
  }
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('quiz_questions');
  if (!hasTable) return;

  try {
    await knex.raw(`ALTER TABLE \`quiz_questions\` DROP COLUMN evidence_timestamp`);
  } catch (e) {
    const msg = String(e?.message ?? e);
    if (!msg.includes('check that column/key exists') && !msg.includes('Unknown column')) {
      throw e;
    }
  }
};
