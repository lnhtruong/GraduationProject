exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('notifications');
  if (hasTable) return;

  await knex.schema.createTable('notifications', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable();
    table.string('event_type', 100).notNullable();
    table.string('title', 255).notNullable();
    table.text('message').nullable();
    table.json('payload').nullable();
    table.boolean('is_read').notNullable().defaultTo(false);
    table.string('source_type', 100).nullable();
    table.integer('source_id').nullable();
    table.dateTime('created_at').notNullable().defaultTo(knex.fn.now());
    table
      .dateTime('updated_at')
      .notNullable()
      .defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));

    table.index(['user_id', 'is_read', 'created_at'], 'idx_notifications_user_read_created');
    table.index(['event_type'], 'idx_notifications_event_type');
  });

  await knex.raw(`
    ALTER TABLE \`notifications\`
    ADD CONSTRAINT \`fk_notifications_user\`
    FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
  `);
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('notifications');
  if (!hasTable) return;

  await knex.schema.dropTable('notifications');
};
