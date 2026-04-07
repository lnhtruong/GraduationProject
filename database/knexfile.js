require("dotenv").config();

module.exports = {
  development: {
    client: "mysql2",
    connection: {
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || "graduation_user",
      password: process.env.DB_PASSWORD || "graduation_password",
      database: process.env.DB_NAME || "graduation_db",

      // Needed because legacy SQL files contain multiple statements.
      multipleStatements: true,
    },
    migrations: {
      directory: "./knex_migrations",
      tableName: "knex_migrations",
    },
  },
  railway: {
    client: "mysql2",
    connection: {
      host: process.env.DB_HOST || "gondola.proxy.rlwy.net",
      port: Number(process.env.DB_PORT || 44327),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "railway",
      multipleStatements: true,
    },
    migrations: {
      directory: "./knex_migrations",
      tableName: "knex_migrations",
    },
  },
};
