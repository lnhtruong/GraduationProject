const fs = require("fs");
const path = require("path");

/**
 * Đường tới file SQL trong `database/migrations/` (legacy / script gộp).
 */
function legacySqlPath(fileName) {
  return path.join(__dirname, "..", "migrations", fileName);
}

/**
 * Chạy nguyên nội dung file SQL (cần `multipleStatements: true` trong knexfile nếu nhiều câu lệnh).
 */
async function runLegacySqlFile(knex, fileName) {
  const filePath = legacySqlPath(fileName);
  const sql = fs.readFileSync(filePath, "utf8").trim();
  if (!sql) return;
  await knex.raw(sql);
}

async function runLegacySqlFiles(knex, fileNames) {
  for (const fileName of fileNames) {
    await runLegacySqlFile(knex, fileName);
  }
}

function getDbName(knex) {
  const fromEnv = process.env.DB_NAME || process.env.DB_DATABASE;
  if (fromEnv) return fromEnv;

  const connection =
    knex?.client?.config?.connection ??
    knex?.client?.config?.connectionConfig ??
    knex?.client?.config?.connectionSettings;

  if (connection && typeof connection === "object" && connection.database) {
    return connection.database;
  }
  return undefined;
}

async function hasTable(knex, tableName) {
  return knex.schema.hasTable(tableName);
}

async function hasColumn(knex, tableName, columnName) {
  const dbName = getDbName(knex);
  if (!dbName) {
    throw new Error(
      "Missing DB_NAME/DB_DATABASE (or knex connection.database). Cannot check information_schema."
    );
  }

  const result = await knex.raw(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.columns
     WHERE table_schema = ?
       AND table_name = ?
       AND column_name = ?`,
    [dbName, tableName, columnName]
  );

  const rows = Array.isArray(result) ? result[0] : result;
  const firstRow = Array.isArray(rows) ? rows[0] : rows;
  const cnt = Number(firstRow?.cnt ?? 0);
  return cnt > 0;
}

async function isColumnNullable(knex, tableName, columnName) {
  const dbName = getDbName(knex);
  if (!dbName) {
    throw new Error(
      "Missing DB_NAME/DB_DATABASE (or knex connection.database). Cannot check information_schema."
    );
  }

  const result = await knex.raw(
    `SELECT IS_NULLABLE AS isNullable
     FROM information_schema.columns
     WHERE table_schema = ?
       AND table_name = ?
       AND column_name = ?`,
    [dbName, tableName, columnName]
  );

  const rows = Array.isArray(result) ? result[0] : result;
  const firstRow = Array.isArray(rows) ? rows[0] : rows;
  const isNullable = String(firstRow?.isNullable ?? "").toUpperCase();
  return isNullable === "YES";
}

async function hasIndex(knex, tableName, indexName) {
  const dbName = getDbName(knex);
  if (!dbName) {
    throw new Error(
      "Missing DB_NAME/DB_DATABASE (or knex connection.database). Cannot check information_schema."
    );
  }

  const result = await knex.raw(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.statistics
     WHERE table_schema = ?
       AND table_name = ?
       AND index_name = ?`,
    [dbName, tableName, indexName]
  );

  const rows = Array.isArray(result) ? result[0] : result;
  const firstRow = Array.isArray(rows) ? rows[0] : rows;
  const cnt = Number(firstRow?.cnt ?? 0);
  return cnt > 0;
}

const up = async () => { };
const down = async () => { };

module.exports = {
  up,
  down,
  legacySqlPath,
  runLegacySqlFile,
  runLegacySqlFiles,
  getDbName,
  hasTable,
  hasColumn,
  isColumnNullable,
  hasIndex,
};
