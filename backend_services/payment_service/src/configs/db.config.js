require('dotenv').config();

module.exports = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    username: process.env.DB_USERNAME || 'graduation_user',
    password: process.env.DB_PASSWORD || 'graduation_password',
    database: process.env.DB_DATABASE || 'graduation_db',
    dialect: 'mysql',
    logging: false, // Set to console.log to see SQL queries
    timezone: '+07:00',
};