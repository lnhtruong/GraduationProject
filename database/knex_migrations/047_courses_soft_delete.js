/**
 * Courses — soft delete.
 *
 * Thêm cột `deleted_at` để bật chế độ paranoid của Sequelize: `course.destroy()`
 * sẽ set `deleted_at` thay vì xoá cứng, và mọi truy vấn course tự động loại trừ
 * row đã xoá. Khóa học đã xoá vẫn còn trong DB (phục vụ enroll/lịch sử) nhưng
 * không hiển thị nữa. Nullable; row hiện tại = NULL (chưa xoá).
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('courses');
  if (!hasTable) return;

  const hasColumn = await knex.schema.hasColumn('courses', 'deleted_at');
  if (hasColumn) return;

  await knex.schema.alterTable('courses', (table) => {
    table.timestamp('deleted_at').nullable().after('updated_at');
  });
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('courses');
  if (!hasTable) return;

  const hasColumn = await knex.schema.hasColumn('courses', 'deleted_at');
  if (!hasColumn) return;

  await knex.schema.alterTable('courses', (table) => {
    table.dropColumn('deleted_at');
  });
};
