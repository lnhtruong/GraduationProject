exports.up = function (knex) {
  return knex.raw(`
    CREATE TABLE IF NOT EXISTS \`feed_comments\` (
      \`id\` INT(11) NOT NULL AUTO_INCREMENT,
      \`highlight_id\` INT(11) NOT NULL,
      \`user_id\` INT(11) NOT NULL,
      \`content\` TEXT NOT NULL,
      \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      INDEX \`idx_feed_comments_highlight\` (\`highlight_id\`),
      INDEX \`idx_feed_comments_user\` (\`user_id\`),
      CONSTRAINT \`fk_fc_highlight\` FOREIGN KEY (\`highlight_id\`)
        REFERENCES \`highlight_feed\`(\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_fc_user\` FOREIGN KEY (\`user_id\`)
        REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
};

exports.down = function (knex) {
  return knex.raw(`
    DROP TABLE IF EXISTS \`feed_comments\`;
  `);
};