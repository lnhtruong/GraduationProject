const { Sequelize } = require('sequelize');
const dbConfig = require('../configs/db.config');

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  logging: dbConfig.logging,
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Models
db.Payment = require('./payment.model')(sequelize);

module.exports = db;
