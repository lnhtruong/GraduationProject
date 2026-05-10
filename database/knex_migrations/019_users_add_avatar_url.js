/**
 * Adds nullable avatarUrl column to users for profile/background image.
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('users');
  if (!hasTable) return;

  const [col] = await knex.raw(
    `SELECT COUNT(*) AS c FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'avatarUrl'`,
  );
  if (Number(col?.[0]?.c ?? 0) === 0) {
    await knex.raw(`
      ALTER TABLE users
      ADD COLUMN avatarUrl VARCHAR(512) DEFAULT NULL
    `);
  }
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('users');
  if (!hasTable) return;

  try {
    await knex.raw(`ALTER TABLE users DROP COLUMN avatarUrl`);
  } catch (e) {
    const msg = String(e?.message ?? e);
    if (!msg.includes('check that column exists') && !msg.includes('Unknown column')) {
      throw e;
    }
  }
};
