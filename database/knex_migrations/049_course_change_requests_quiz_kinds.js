/**
 * Course change requests — mở rộng `kind` enum cho thao tác quiz.
 *
 * Trước đây `kind` chỉ gồm course.update + lesson.* . Nay thêm quiz.create /
 * quiz.update / quiz.delete để giảng viên sửa quiz trên khóa ĐÃ publish cũng
 * đi qua change request chờ admin duyệt (giống lesson). Default vẫn là
 * `course.update` để các row cũ giữ nguyên hành vi.
 */
const KIND_VALUES = [
  'course.update',
  'lesson.create',
  'lesson.update',
  'lesson.delete',
  'quiz.create',
  'quiz.update',
  'quiz.delete',
];

const KIND_VALUES_BEFORE = [
  'course.update',
  'lesson.create',
  'lesson.update',
  'lesson.delete',
];

const toEnumSql = (values) => values.map((v) => `'${v}'`).join(', ');

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('course_change_requests');
  if (!hasTable) return;

  const hasKind = await knex.schema.hasColumn('course_change_requests', 'kind');
  if (!hasKind) return;

  await knex.raw(
    `ALTER TABLE course_change_requests MODIFY COLUMN kind ENUM(${toEnumSql(
      KIND_VALUES,
    )}) NOT NULL DEFAULT 'course.update'`,
  );
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('course_change_requests');
  if (!hasTable) return;

  const hasKind = await knex.schema.hasColumn('course_change_requests', 'kind');
  if (!hasKind) return;

  // Dọn các row quiz.* trước khi thu hẹp enum để tránh lỗi truncate.
  await knex('course_change_requests')
    .whereIn('kind', ['quiz.create', 'quiz.update', 'quiz.delete'])
    .del();

  await knex.raw(
    `ALTER TABLE course_change_requests MODIFY COLUMN kind ENUM(${toEnumSql(
      KIND_VALUES_BEFORE,
    )}) NOT NULL DEFAULT 'course.update'`,
  );
};
