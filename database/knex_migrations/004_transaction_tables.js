const { runLegacySqlFiles } = require("../helpers/_legacy_sql");

/**
 * Migration 009: Hỗ trợ multi-course transactions.
 * Chạy file SQL 009_transaction_tables.sql
 */
exports.up = async function (knex) {
  if (!(await knex.schema.hasTable("Transactions"))) {
    await runLegacySqlFiles(knex, ["transaction_tables.sql"]);
  }
};

exports.down = async function (knex) {
  // Tránh tự động xóa data quan trọng
};
