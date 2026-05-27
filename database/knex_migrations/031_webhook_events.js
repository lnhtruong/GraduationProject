exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable("webhook_events");
  if (hasTable) return;

  await knex.raw(`
    CREATE TABLE webhook_events (
      id INT(11) NOT NULL AUTO_INCREMENT,
      provider VARCHAR(50) NOT NULL,
      event_id VARCHAR(255) NOT NULL,
      signature_hash VARCHAR(255) NULL,
      processed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      payload JSON NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_webhook_events_provider_event (provider, event_id),
      INDEX idx_webhook_events_processed_at (processed_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
};

exports.down = async function (knex) {
  await knex.raw(`DROP TABLE IF EXISTS webhook_events;`);
};
