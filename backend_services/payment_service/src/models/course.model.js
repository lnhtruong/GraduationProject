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
        }
    }, {
        tableName: 'courses',
        timestamps: false,
    });
};
