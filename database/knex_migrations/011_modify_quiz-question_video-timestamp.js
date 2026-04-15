/**
 * Enrolls + LessonProgress (course enrollment & per-lesson state).
 * Depends on: users, Courses, lessons (003 / initial_schema).
 */
exports.up = async function (knex) {
  await knex.raw(`
    ALTER TABLE quiz_questions
    MODIFY COLUMN video_timestamp TIME(3) NULL;
  `);
};

exports.down = async function (knex) {
  await knex.raw(`
    ALTER TABLE quiz_questions
    MODIFY COLUMN video_timestamp TIME NULL;
  `);
};
