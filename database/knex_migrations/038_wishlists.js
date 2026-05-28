/**
 * BE-05 — Wishlists.
 *
 * One row per (user_id, course_id). The unique constraint guarantees
 * idempotent POST /api/wishlist semantics in BE-05's service layer.
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('wishlists');
  if (hasTable) return;

  await knex.schema.createTable('wishlists', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable();
    table.integer('course_id').notNullable();
    table.dateTime('added_at').notNullable().defaultTo(knex.fn.now());

    table.unique(['user_id', 'course_id'], 'uniq_wishlists_user_course');
    table.index(['user_id'], 'idx_wishlists_user');
    table.index(['course_id'], 'idx_wishlists_course');
  });

  await knex.raw(`
    ALTER TABLE \`wishlists\`
    ADD CONSTRAINT \`fk_wishlists_user\`
    FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
  `);

  await knex.raw(`
    ALTER TABLE \`wishlists\`
    ADD CONSTRAINT \`fk_wishlists_course\`
    FOREIGN KEY (\`course_id\`) REFERENCES \`courses\`(\`id\`) ON DELETE CASCADE
  `);
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('wishlists');
  if (!hasTable) return;
  await knex.schema.dropTable('wishlists');
};
