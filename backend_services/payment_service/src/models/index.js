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

// Models (new multi-course transaction)
db.Course = require('./course.model')(sequelize);
db.Transaction = require('./transaction.model')(sequelize);
db.TransactionItem = require('./transaction_item.model')(sequelize);
db.WebhookEvent = require('./webhook_event.model')(sequelize);

// Associations
// 1 Transaction → nhiều Transaction_Items
db.Transaction.hasMany(db.TransactionItem, {
    foreignKey: 'transaction_id',
    as: 'items',
    onDelete: 'CASCADE',
});
db.TransactionItem.belongsTo(db.Transaction, {
    foreignKey: 'transaction_id',
    as: 'transaction',
});

module.exports = db;