/**
 * Add origin_cmt to support 2-level nested comments.
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('feed_comments');
  if (!hasTable) return;

  const hasColumn = await knex.schema.hasColumn('feed_comments', 'origin_cmt');
  if (!hasColumn) {
    await knex.raw(`
      ALTER TABLE feed_comments
      ADD COLUMN origin_cmt INT(11) NULL AFTER content
    `);
  }

  await knex.raw(`
    ALTER TABLE feed_comments
    ADD INDEX idx_feed_comments_origin_cmt (origin_cmt)
  `).catch(() => undefined);

  await knex.raw(`
    ALTER TABLE feed_comments
    ADD CONSTRAINT fk_fc_origin_cmt
      FOREIGN KEY (origin_cmt) REFERENCES feed_comments(id)
      ON DELETE CASCADE ON UPDATE CASCADE
  `).catch(() => undefined);
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('feed_comments');
  if (!hasTable) return;

  const hasColumn = await knex.schema.hasColumn('feed_comments', 'origin_cmt');
  if (!hasColumn) return;

  await knex.raw(`ALTER TABLE feed_comments DROP FOREIGN KEY fk_fc_origin_cmt`).catch(() => undefined);
  await knex.raw(`ALTER TABLE feed_comments DROP INDEX idx_feed_comments_origin_cmt`).catch(() => undefined);
  await knex.raw(`ALTER TABLE feed_comments DROP COLUMN origin_cmt`);
};
