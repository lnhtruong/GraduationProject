/**
 * BE-06 — InstructorFollows.
 *
 * One row per (follower_id, instructor_id). Unique key guarantees idempotency
 * of POST /api/instructors/:id/follow.
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('instructor_follows');
  if (hasTable) return;

  await knex.schema.createTable('instructor_follows', (table) => {
    table.increments('id').primary();
    table.integer('follower_id').notNullable();
    table.integer('instructor_id').notNullable();
    table.dateTime('followed_at').notNullable().defaultTo(knex.fn.now());

    table.unique(['follower_id', 'instructor_id'], 'uniq_instructor_follows_pair');
    table.index(['instructor_id'], 'idx_instructor_follows_instructor');
    table.index(['follower_id'], 'idx_instructor_follows_follower');
  });

  await knex.raw(`
    ALTER TABLE \`instructor_follows\`
    ADD CONSTRAINT \`fk_instructor_follows_follower\`
    FOREIGN KEY (\`follower_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
  `);

  await knex.raw(`
    ALTER TABLE \`instructor_follows\`
    ADD CONSTRAINT \`fk_instructor_follows_instructor\`
    FOREIGN KEY (\`instructor_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
  `);
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('instructor_follows');
  if (!hasTable) return;
  await knex.schema.dropTable('instructor_follows');
};
