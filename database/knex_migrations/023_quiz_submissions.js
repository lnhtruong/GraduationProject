/**
 * Lưu kết quả làm quiz của student (chấm điểm server-side, snapshot answers).
 */
exports.up = async (knex) => {
  const exists = await knex.schema.hasTable("quiz_submissions");
  if (exists) return;

  await knex.schema.createTable("quiz_submissions", (table) => {
    table.increments("id").primary();

    table
      .integer("quiz_id")
      .notNullable()
      .references("id")
      .inTable("quizzes")
      .onDelete("CASCADE");

    table.integer("user_id").notNullable();

    table.decimal("score", 10, 2).nullable();
    table.decimal("max_score", 10, 2).nullable();
    table.decimal("percent", 5, 2).nullable();
    table.boolean("passed").notNullable().defaultTo(false);
    table.integer("time_spent_seconds").nullable();
    table.json("answers").nullable();
    table.timestamps(true, true);

    table.index("quiz_id", "idx_quiz_submissions_quiz_id");
    table.index("user_id", "idx_quiz_submissions_user_id");
    table.index(["quiz_id", "user_id"], "idx_quiz_submissions_quiz_user");
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists("quiz_submissions");
};
