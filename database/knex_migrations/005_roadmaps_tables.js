exports.up = async function (knex) {
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS roadmaps (
      id INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
      user_id INTEGER,
      description VARCHAR(255),
      name VARCHAR(255),
      total_courses INTEGER,
      progress INTEGER COMMENT 'total number courses finished',
      PRIMARY KEY (id),
      CONSTRAINT fk_roadmaps_user_lower FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS roadmap_course (
      id INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
      course_id INTEGER,
      roadmap_id INTEGER,
      \`index\` INTEGER COMMENT 'learning order in roadmap',
      status ENUM('null', 'learning', 'finish') DEFAULT NULL COMMENT 'null, learning, finish',
      PRIMARY KEY (id),
      CONSTRAINT fk_roadmap_course_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_roadmap_course_roadmap FOREIGN KEY (roadmap_id) REFERENCES roadmaps (id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
};

exports.down = async function (knex) {
  await knex.raw(`
    DROP TABLE IF EXISTS roadmap_course;
    DROP TABLE IF EXISTS roadmaps;
  `);
};
