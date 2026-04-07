const fs = require("fs");
const path = require("path");

/**
 * Một lần chạy `initial_schema.sql` → đủ schema hiện tại (gộp legacy 001–008).
 * Nếu DB đã có bảng `users` (đã tạo tay / môi trường cũ): bỏ qua để không lỗi trùng object.
 */
exports.up = async function (knex) {
  const hasUsers = await knex.schema.hasTable("users");
  if (hasUsers) return;

  const sqlPath = path.join(
    __dirname,
    "..",
    "migrations",
    "initial_schema.sql",
  );
  const sql = fs.readFileSync(sqlPath, "utf8").trim();
  if (!sql) return;

  await knex.raw(sql);
};

exports.down = async function () {
  // Không drop toàn bộ schema — tránh mất dữ liệu.
};
