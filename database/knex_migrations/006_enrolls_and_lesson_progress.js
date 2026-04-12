/**
 * Enrolls + LessonProgress (course enrollment & per-lesson state).
 * Depends on: users, Courses, lessons (003 / initial_schema).
 */
exports.up = async function (knex) {
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS Enrolls (
      id INTEGER NOT NULL AUTO_INCREMENT,
      user_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      progress DOUBLE NOT NULL DEFAULT 0,
      status ENUM('active', 'completed', 'dropped') NOT NULL DEFAULT 'active' COMMENT 'active, completed, dropped',
      enrolled_at DATETIME NOT NULL,
      completed_at DATETIME NULL,
      PRIMARY KEY (id),
      CONSTRAINT fk_enrolls_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_enrolls_course FOREIGN KEY (course_id) REFERENCES Courses (id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS LessonProgress (
      id INTEGER NOT NULL AUTO_INCREMENT,
      user_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      lesson_id INTEGER NOT NULL,
      progress ENUM('not_started', 'in_progress', 'completed') NOT NULL DEFAULT 'not_started' COMMENT 'not_started, in_progress, completed',
      PRIMARY KEY (id),
      CONSTRAINT fk_lesson_progress_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_lesson_progress_course FOREIGN KEY (course_id) REFERENCES Courses (id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_lesson_progress_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
};

exports.down = async function (knex) {
  await knex.raw(`
    DROP TABLE IF EXISTS LessonProgress;
    DROP TABLE IF EXISTS Enrolls;
  `);
};
