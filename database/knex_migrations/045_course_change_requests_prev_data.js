/**
 * Course change requests — snapshot dữ liệu cũ (`prev_data`).
 *
 * `payload` chứa các field MỚI mà instructor muốn áp dụng. Để admin xem được
 * diff (giá trị cũ → giá trị mới) ngay trên màn duyệt, ta lưu thêm `prev_data`
 * là ảnh chụp giá trị hiện tại của course cho đúng các field có trong payload.
 * - Chụp tại lúc tạo/ghi đè request (pending).
 * - Làm tươi lại ngay trước khi approve (phòng course bị đổi trong lúc chờ).
 * Nullable vì các request cũ tạo trước migration này chưa có snapshot.
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('course_change_requests');
  if (!hasTable) return;

  const hasColumn = await knex.schema.hasColumn(
    'course_change_requests',
    'prev_data',
  );
  if (hasColumn) return;

  await knex.schema.alterTable('course_change_requests', (table) => {
    table.json('prev_data').nullable().after('payload');
  });
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('course_change_requests');
  if (!hasTable) return;

  const hasColumn = await knex.schema.hasColumn(
    'course_change_requests',
    'prev_data',
  );
  if (!hasColumn) return;

  await knex.schema.alterTable('course_change_requests', (table) => {
    table.dropColumn('prev_data');
  });
};
