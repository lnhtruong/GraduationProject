exports.up = async function (knex) {
  const hasColumn = await knex.schema.hasColumn('cart_items', 'saved_for_later');
  if (!hasColumn) {
    await knex.schema.table('cart_items', (table) => {
      table.boolean('saved_for_later').notNullable().defaultTo(false);
    });
  }
};

exports.down = async function (knex) {
  const hasColumn = await knex.schema.hasColumn('cart_items', 'saved_for_later');
  if (hasColumn) {
    await knex.schema.table('cart_items', (table) => {
      table.dropColumn('saved_for_later');
    });
  }
};
