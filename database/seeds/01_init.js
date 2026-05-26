/**
 * Knex seed wrapper cho `database/migrations/seed_data.sql`.
 *
 * SQL file là multi-statement (TRUNCATE + INSERT cho ~14 bảng) nên cần
 * `multipleStatements: true` trong knexfile — đã có ở cả env `development` và
 * `railway`. File seed_data.sql tự `SET FOREIGN_KEY_CHECKS = 0` đầu file rồi
 * bật lại cuối file, nên thứ tự TRUNCATE/INSERT đã được xử lý sẵn.
 *
 * Idempotent: chạy lại nhiều lần vẫn OK vì SQL file TRUNCATE bảng trước khi
 * insert.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

const fs = require('fs');
const path = require('path');

const SEED_SQL_PATH = path.join(__dirname, '..', 'migrations', 'seed_data.sql');

exports.seed = async function seed(knex) {
  if (!fs.existsSync(SEED_SQL_PATH)) {
    throw new Error(`Seed SQL not found at ${SEED_SQL_PATH}`);
  }

  // Strip BOM nếu file được lưu UTF-8-BOM (vài editor trên Windows thêm vào)
  // — mysql2 sẽ syntax-error nếu byte BOM lọt vào câu SQL đầu tiên.
  const sql = fs.readFileSync(SEED_SQL_PATH, 'utf8').replace(/^﻿/, '');

  // Sanity-check: cần `multipleStatements: true` ở connection config.
  // knex.client.config.connection có thể là object hoặc function — đọc cả 2.
  const conn = knex.client.config.connection;
  const connOpts =
    typeof conn === 'function' ? null : conn || {};
  if (connOpts && connOpts.multipleStatements === false) {
    throw new Error(
      'seed_data.sql is multi-statement. Set `multipleStatements: true` in knexfile connection.',
    );
  }

  // knex.raw forward thẳng cả block xuống mysql2 (đã enable
  // multipleStatements). File seed tự quản FOREIGN_KEY_CHECKS nên không cần
  // wrap transaction (TRUNCATE auto-commits ở MySQL).
  await knex.raw(sql);
};
