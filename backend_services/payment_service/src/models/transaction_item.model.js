const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const TransactionItem = sequelize.define(
        'TransactionItem',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },

            transaction_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },

            course_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },

            price: {
                type: DataTypes.DOUBLE,
                allowNull: false,
                comment: 'Giá course tại thời điểm mua (snapshot)',
            },
        },
        {
            tableName: 'transaction_items',
            timestamps: false,
        }
    );

    return TransactionItem;
};
