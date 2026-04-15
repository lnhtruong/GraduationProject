exports.up = async function (knex) {
    await knex.schema.createTable('carts', (table) => {
        table.increments('id').primary(); // unsigned

        table.integer('user_id').notNullable().unique();

        table.integer('total_quantity').notNullable().defaultTo(0);

        table.double('total_amount').notNullable().defaultTo(0);

        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });

    await knex.schema.createTable('cart_items', (table) => {
        table.increments('id').primary();

        table
            .integer('cart_id')
            .unsigned() // 🔥 fix ở đây
            .notNullable()
            .references('id')
            .inTable('carts')
            .onDelete('CASCADE');

        table.integer('course_id').notNullable();

        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};

exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('cart_items');
    await knex.schema.dropTableIfExists('carts');
};