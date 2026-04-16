/**
 * Creates Courses table if it does not exist.
 */
exports.up = async function (knex) {
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
      name VARCHAR(255) NOT NULL,
      description VARCHAR(255),
      categories JSON NOT NULL,
      level ENUM('Beginner', 'Intermediate', 'Advanced') NOT NULL DEFAULT 'Beginner' COMMENT 'Beginner, Intermediate, Advanced',
      duration TIME(3) NULL,
      language VARCHAR(255) NOT NULL,
      price DOUBLE NOT NULL,
      user_id INTEGER NOT NULL,
      status ENUM('draft', 'pending', 'approved', 'rejected', 'publish') NOT NULL DEFAULT 'draft' COMMENT 'draft, pending, approved, rejected, publish',
      created_at DATETIME,
      updated_at DATETIME,
      PRIMARY KEY(id)
    );
  `);
};

exports.down = async function (knex) {
  await knex.raw("DROP TABLE IF EXISTS courses");
};
