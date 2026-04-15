exports.up = async function (knex) {
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS feedbacks (
      id INT(11) NOT NULL AUTO_INCREMENT,
      course_id INT(11) NOT NULL,
      user_id INT(11) NOT NULL,
      rating TINYINT UNSIGNED NOT NULL,
      review_text TEXT NOT NULL,
      is_visible BOOLEAN NOT NULL DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at DATETIME NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uq_feedback_course_user (course_id, user_id),
      INDEX idx_feedback_course_id (course_id),
      INDEX idx_feedback_user_id (user_id),
      CONSTRAINT fk_feedback_course
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS feedback_reactions (
      id INT(11) NOT NULL AUTO_INCREMENT,
      feedback_id INT(11) NOT NULL,
      user_id INT(11) NOT NULL,
      reaction_type ENUM('help_ful','dislike') NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_feedback_reaction_user (feedback_id, user_id),
      INDEX idx_feedback_reactions_feedback_id (feedback_id),
      INDEX idx_feedback_reactions_user_id (user_id),
      CONSTRAINT fk_feedback_reaction_feedback
        FOREIGN KEY (feedback_id) REFERENCES feedbacks(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
};

exports.down = async function (knex) {
  await knex.raw(`
    DROP TABLE IF EXISTS feedback_reactions;
    DROP TABLE IF EXISTS feedbacks;
  `);
};
