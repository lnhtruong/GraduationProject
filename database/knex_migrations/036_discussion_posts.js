/**
 * BE-01 — Discussion Forum: discussion_posts table.
 *
 * Self-referential reply support via parent_id (2-level nesting enforced
 * at the application layer in BE-02). is_best_answer + upvotes are denormalised
 * counters for fast list queries; upvotes is kept consistent by BE-03.
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('discussion_posts');
  if (hasTable) return;

  await knex.schema.createTable('discussion_posts', (table) => {
    table.increments('id').primary();
    // lesson_id / user_id are signed INT to match lessons.id and users.id;
    // parent_id is UNSIGNED to match this table's own id (knex `increments`).
    table.integer('lesson_id').notNullable();
    table.integer('user_id').notNullable();
    table.integer('parent_id').unsigned().nullable();
    table.text('content').notNullable();
    table.boolean('is_best_answer').notNullable().defaultTo(false);
    table.integer('upvotes').notNullable().defaultTo(0);
    table.dateTime('created_at').notNullable().defaultTo(knex.fn.now());
    table
      .dateTime('updated_at')
      .notNullable()
      .defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));

    table.index(['lesson_id', 'created_at'], 'idx_discussion_posts_lesson_created');
    table.index(['parent_id'], 'idx_discussion_posts_parent');
    table.index(['user_id'], 'idx_discussion_posts_user');
  });

  await knex.raw(`
    ALTER TABLE \`discussion_posts\`
    ADD CONSTRAINT \`fk_discussion_posts_lesson\`
    FOREIGN KEY (\`lesson_id\`) REFERENCES \`lessons\`(\`id\`) ON DELETE CASCADE
  `);

  await knex.raw(`
    ALTER TABLE \`discussion_posts\`
    ADD CONSTRAINT \`fk_discussion_posts_user\`
    FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
  `);

  await knex.raw(`
    ALTER TABLE \`discussion_posts\`
    ADD CONSTRAINT \`fk_discussion_posts_parent\`
    FOREIGN KEY (\`parent_id\`) REFERENCES \`discussion_posts\`(\`id\`) ON DELETE CASCADE
  `);
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('discussion_posts');
  if (!hasTable) return;
  await knex.schema.dropTable('discussion_posts');
};
