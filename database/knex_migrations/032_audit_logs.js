exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable("audit_logs");
  if (hasTable) return;

  await knex.raw(`
    CREATE TABLE audit_logs (
      id INT(11) NOT NULL AUTO_INCREMENT,
      actor_user_id INT(11) NOT NULL,
      actor_role INT(11) NOT NULL,
      action VARCHAR(100) NOT NULL,
      target_type VARCHAR(50) NULL,
      target_id INT(11) NULL,
      \`before\` JSON NULL,
      \`after\` JSON NULL,
      metadata JSON NULL,
      ip VARCHAR(45) NULL,
      user_agent VARCHAR(512) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_audit_logs_actor (actor_user_id),
      INDEX idx_audit_logs_action (action),
      INDEX idx_audit_logs_target (target_type, target_id),
      INDEX idx_audit_logs_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
};

exports.down = async function (knex) {
  await knex.raw(`DROP TABLE IF EXISTS audit_logs;`);
};
