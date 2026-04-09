const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Transaction = sequelize.define(
        'Transaction',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },

            user_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },

            total_amount: {
                type: DataTypes.DOUBLE,
                allowNull: false,
                comment: 'Tổng tiền của tất cả courses trong đơn',
            },

            status: {
                type: DataTypes.ENUM('pending', 'paid', 'failed'),
                defaultValue: 'pending',
                allowNull: false,
            },

            provider: {
                type: DataTypes.STRING(50),
                defaultValue: 'payos',
                allowNull: false,
            },

            provider_order_id: {
                type: DataTypes.STRING(255),
                unique: true,
                allowNull: true,
                comment: 'Mã đơn hàng từ PayOS (orderCode)',
            },

            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
                allowNull: false,
            },

            paid_at: {
                type: DataTypes.DATE,
                allowNull: true,
                comment: 'Thời điểm thanh toán thành công',
            },
        },
        {
            tableName: 'transactions',
            timestamps: false,
        }
    );

    return Transaction;
};
