exports.up = async function (knex) {
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

  if (!(await columnExists("githubId"))) {
    await knex.raw(`
      ALTER TABLE users
        ADD COLUMN githubId VARCHAR(255) NULL UNIQUE
    `);
  }

  if (!(await columnExists("facebookId"))) {
    await knex.raw(`
      ALTER TABLE users
        ADD COLUMN facebookId VARCHAR(255) NULL UNIQUE
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

  if (await columnExists("githubId")) {
    await knex.raw(`ALTER TABLE users DROP COLUMN githubId`);
  }
  if (await columnExists("facebookId")) {
    await knex.raw(`ALTER TABLE users DROP COLUMN facebookId`);
  }
};
