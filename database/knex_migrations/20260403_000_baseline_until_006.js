const { hasColumn, runLegacySqlFiles } = require("./_legacy_sql");

/**
 * Baseline cho trạng thái DB đã chạy tới hết migration legacy 006.
 *
 * - Với DB "cũ": thường đã có lesson/quizzes => migration này sẽ no-op.
 * - Với DB "mới": migration này sẽ chạy SQL 001..006 để dựng schema về đúng mốc.
 */
exports.up = async function (knex) {
  // Baseline: chỉ chạy legacy migration nào còn thiếu để tránh chạy lại gây lỗi (VD: 001 có INSERT vào roles).
  const toRun = [];

  if (!(await knex.schema.hasTable("users"))) {
    toRun.push("001_create_users_table.sql");
  }

  // 003 must be before 004 because projects references videos
  if (!(await knex.schema.hasTable("videos"))) {
    toRun.push("003_unify_videos.sql");
  }

  // 004 must be before 002 because mascot_overlays references projects
  if (!(await knex.schema.hasTable("projects"))) {
    toRun.push("004_create_projects_table.sql");
  }

  if (!(await knex.schema.hasTable("mascot_images"))) {
    toRun.push("002_mascot_tables.sql");
  }

  const hasThumbnail = await hasColumn(knex, "videos", "thumbnail");
  if (!hasThumbnail) {
    toRun.push("005_update_videos_table_thumbnail.sql");
  }

  // 006 dùng CREATE TABLE không có IF NOT EXISTS => chỉ chạy khi chưa có lessons.
  if (!(await knex.schema.hasTable("lessons"))) {
    toRun.push("006_lesson_quizz_table.sql");
  }

  if (toRun.length === 0) return;
  await runLegacySqlFiles(knex, toRun);
};

exports.down = async function (knex) {
  // Baseline: không tự rollback để tránh phá DB đang có dữ liệu.
};

