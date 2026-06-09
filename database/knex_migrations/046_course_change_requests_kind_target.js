/**
 * Course change requests — mở rộng cho lesson change requests.
 *
 * Trước đây bảng `course_change_requests` chỉ phục vụ cập nhật cấp course
 * (mỗi course tối đa 1 request pending). Nay tái sử dụng chính bảng này cho
 * cả thao tác lesson trên khóa học ĐÃ publish (thêm/sửa/xoá), thay vì chặn:
 *
 * - `kind`: loại thay đổi. Mặc định `course.update` để các row cũ giữ nguyên
 *   hành vi (course-level update). Các giá trị lesson.* dành cho thao tác lesson.
 * - `target_id`: id của lesson đích cho `lesson.update` / `lesson.delete`
 *   (null với `course.update` và `lesson.create` vì chưa có lesson tương ứng).
 */
const KIND_VALUES = [
  'course.update',
  'lesson.create',
  'lesson.update',
  'lesson.delete',
];

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('course_change_requests');
  if (!hasTable) return;

  const [hasKind, hasTarget] = await Promise.all([
    knex.schema.hasColumn('course_change_requests', 'kind'),
    knex.schema.hasColumn('course_change_requests', 'target_id'),
  ]);

  if (hasKind && hasTarget) return;

  await knex.schema.alterTable('course_change_requests', (table) => {
    if (!hasKind) {
      table
        .enu('kind', KIND_VALUES)
        .notNullable()
        .defaultTo('course.update')
        .after('prev_data');
    }
    if (!hasTarget) {
      table.integer('target_id').nullable().after('kind');
    }
  });
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('course_change_requests');
  if (!hasTable) return;

  const [hasKind, hasTarget] = await Promise.all([
    knex.schema.hasColumn('course_change_requests', 'kind'),
    knex.schema.hasColumn('course_change_requests', 'target_id'),
  ]);

  if (!hasKind && !hasTarget) return;

  await knex.schema.alterTable('course_change_requests', (table) => {
    if (hasTarget) {
      table.dropColumn('target_id');
    }
    if (hasKind) {
      table.dropColumn('kind');
    }
  });
};
