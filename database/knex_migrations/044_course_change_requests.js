/**
 * Course change requests.
 *
 * Khi một course đã ở trạng thái `publish`, instructor không sửa trực tiếp nữa.
 * Mọi chỉnh sửa được gói vào `payload` (UpdateCourseDto) và chờ admin duyệt.
 * Admin approve → service apply payload vào course (giữ nguyên publish);
 * reject → course không đổi. Tối đa 1 request `pending` / course được đảm bảo
 * ở tầng service (MySQL không hỗ trợ partial unique index).
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('course_change_requests');
  if (hasTable) return;

  await knex.schema.createTable('course_change_requests', (table) => {
    table.increments('id').primary();
    table.integer('course_id').notNullable();
    table.integer('requested_by').notNullable();
    table.json('payload').notNullable();
    table
      .enu('status', ['pending', 'approved', 'rejected'])
      .notNullable()
      .defaultTo('pending');
    table.integer('reviewed_by').nullable();
    table.text('review_note').nullable();
    table.dateTime('created_at').notNullable().defaultTo(knex.fn.now());
    table.dateTime('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index(['course_id'], 'idx_course_change_requests_course');
    table.index(['status'], 'idx_course_change_requests_status');
  });

  await knex.raw(`
    ALTER TABLE \`course_change_requests\`
    ADD CONSTRAINT \`fk_course_change_requests_course\`
    FOREIGN KEY (\`course_id\`) REFERENCES \`courses\`(\`id\`) ON DELETE CASCADE
  `);
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('course_change_requests');
  if (!hasTable) return;
  await knex.schema.dropTable('course_change_requests');
};
