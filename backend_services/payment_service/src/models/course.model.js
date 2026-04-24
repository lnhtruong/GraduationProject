const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Course', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        price: {
            type: DataTypes.DOUBLE,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('draft', 'pending', 'approved', 'rejected', 'publish'),
            allowNull: false,
            defaultValue: 'draft',
        }
    }, {
        tableName: 'courses',
        timestamps: false,
    });
};
