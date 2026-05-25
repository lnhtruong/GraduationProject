exports.up = async function (knex) {
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS reports (
      id INT(11) NOT NULL AUTO_INCREMENT,
      target_type ENUM('teacher','course','lesson') NOT NULL,
      target_id INT(11) NOT NULL,
      reason TEXT NOT NULL,
      status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
      reporter_id INT(11) NOT NULL,
      approver_id INT(11) NULL,
      review_note TEXT NULL,
      reviewed_at DATETIME NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_reports_status (status),
      INDEX idx_reports_target (target_type, target_id),
      INDEX idx_reports_reporter (reporter_id),
      INDEX idx_reports_approver (approver_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Extend courses.status enum with 'banned'
  await knex.raw(`
    ALTER TABLE courses
      MODIFY COLUMN status ENUM('draft','pending','approved','rejected','publish','banned')
        NOT NULL DEFAULT 'draft';
  `);

  // Add is_banned column to users
  const hasIsBanned = await knex.schema.hasColumn('users', 'is_banned');
  if (!hasIsBanned) {
    await knex.raw(`
      ALTER TABLE users
        ADD COLUMN is_banned TINYINT(1) NOT NULL DEFAULT 0;
    `);
  }
};

exports.down = async function (knex) {
  await knex.raw(`DROP TABLE IF EXISTS reports;`);
  await knex.raw(`
    ALTER TABLE courses
      MODIFY COLUMN status ENUM('draft','pending','approved','rejected','publish')
        NOT NULL DEFAULT 'draft';
  `);
  const hasIsBanned = await knex.schema.hasColumn('users', 'is_banned');
  if (hasIsBanned) {
    await knex.raw(`ALTER TABLE users DROP COLUMN is_banned;`);
  }
};
