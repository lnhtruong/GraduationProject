/**
 * Google OAuth: nullable password, googleId, emailVerified.
 * avatarUrl may already exist from 019_users_add_avatar_url.
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable("users");
  if (!hasTable) return;

  await knex.raw(`
    ALTER TABLE users
      MODIFY COLUMN password VARCHAR(255) NULL
  `);

  const columnExists = async (columnName) => {
    const [rows] = await knex.raw(
      `SELECT COUNT(*) AS c FROM information_schema.columns
       WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = ?`,
      [columnName],
    );
    return Number(rows?.[0]?.c ?? 0) > 0;
  };

  if (!(await columnExists("googleId"))) {
    await knex.raw(`
      ALTER TABLE users
        ADD COLUMN googleId VARCHAR(255) NULL UNIQUE
    `);
  }

  if (!(await columnExists("emailVerified"))) {
    await knex.raw(`
      ALTER TABLE users
        ADD COLUMN emailVerified TINYINT(1) NOT NULL DEFAULT 0
    `);
  }

  if (!(await columnExists("avatarUrl"))) {
    await knex.raw(`
      ALTER TABLE users
        ADD COLUMN avatarUrl VARCHAR(500) NULL
    `);
  } else {
    await knex.raw(`
      ALTER TABLE users
        MODIFY COLUMN avatarUrl VARCHAR(500) NULL
    `);
  }
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable("users");
  if (!hasTable) return;

  const columnExists = async (columnName) => {
    const [rows] = await knex.raw(
      `SELECT COUNT(*) AS c FROM information_schema.columns
       WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = ?`,
      [columnName],
    );
    return Number(rows?.[0]?.c ?? 0) > 0;
  };

  if (await columnExists("emailVerified")) {
    await knex.raw(`ALTER TABLE users DROP COLUMN emailVerified`);
  }

  if (await columnExists("googleId")) {
    await knex.raw(`ALTER TABLE users DROP COLUMN googleId`);
  }

  await knex.raw(`
    ALTER TABLE users
      MODIFY COLUMN password VARCHAR(255) NOT NULL
  `);
};
