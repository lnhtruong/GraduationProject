exports.up = async function (knex) {
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS lecturer_upgrade_requests (
      id INT(11) NOT NULL AUTO_INCREMENT,
      user_id INT(11) NOT NULL,
      confirm TEXT NULL,
      status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
      reviewer_id INT(11) NULL,
      review_note TEXT NULL,
      reviewed_at DATETIME NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_lecturer_upgrade_requests_user (user_id),
      INDEX idx_lecturer_upgrade_requests_status (status),
      INDEX idx_lecturer_upgrade_requests_reviewer (reviewer_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
};

exports.down = async function (knex) {
  await knex.raw(`DROP TABLE IF EXISTS lecturer_upgrade_requests;`);
};
