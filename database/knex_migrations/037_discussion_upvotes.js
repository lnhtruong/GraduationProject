/**
 * BE-01 — Discussion Forum: discussion_upvotes join table.
 *
 * Unique (post_id, user_id) prevents duplicate upvotes; the discussion_posts.upvotes
 * counter is kept consistent by the upvote-toggle endpoint in BE-03.
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('discussion_upvotes');
  if (hasTable) return;

  await knex.schema.createTable('discussion_upvotes', (table) => {
    table.increments('id').primary();
    // post_id is UNSIGNED to match discussion_posts.id; user_id is SIGNED to match users.id.
    table.integer('post_id').unsigned().notNullable();
    table.integer('user_id').notNullable();
    table.dateTime('created_at').notNullable().defaultTo(knex.fn.now());

    table.unique(['post_id', 'user_id'], 'uniq_discussion_upvotes_post_user');
    table.index(['user_id'], 'idx_discussion_upvotes_user');
  });

  await knex.raw(`
    ALTER TABLE \`discussion_upvotes\`
    ADD CONSTRAINT \`fk_discussion_upvotes_post\`
    FOREIGN KEY (\`post_id\`) REFERENCES \`discussion_posts\`(\`id\`) ON DELETE CASCADE
  `);

  await knex.raw(`
    ALTER TABLE \`discussion_upvotes\`
    ADD CONSTRAINT \`fk_discussion_upvotes_user\`
    FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
  `);
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('discussion_upvotes');
  if (!hasTable) return;
  await knex.schema.dropTable('discussion_upvotes');
};
