const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const WebhookEvent = sequelize.define(
        'WebhookEvent',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            provider: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            event_id: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            signature_hash: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            processed_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
                allowNull: false,
            },
            payload: {
                type: DataTypes.JSON,
                allowNull: true,
            },
        },
        {
            tableName: 'webhook_events',
            timestamps: false,
            indexes: [
                {
                    unique: true,
                    fields: ['provider', 'event_id'],
                    name: 'uniq_webhook_events_provider_event',
                },
            ],
        },
    );

    return WebhookEvent;
};
