'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Reservation extends Model {
        static associate(models) {
            Reservation.belongsTo(models.User, { foreignKey: 'user_id' });
            Reservation.belongsTo(models.Table, { foreignKey: 'table_id' });
        }
    }

    Reservation.init({
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        table_id: { type: DataTypes.INTEGER, allowNull: false },
        reservation_date: { type: DataTypes.DATE, allowNull: false },
        guest_count: { type: DataTypes.INTEGER, allowNull: false },
        status: {
            type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
            defaultValue: 'pending'
        },
        notes: DataTypes.TEXT
    }, {
        sequelize,
        modelName: 'Reservation',
    });

    return Reservation;
};