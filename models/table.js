'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Table extends Model {
        static associate(models) {
            // satu meja bisa punya banyak reservasi
            Table.hasMany(models.Reservation, { foreignKey: 'table_id' });
        }
    }

    Table.init({
        table_number: DataTypes.STRING,
        capacity: DataTypes.INTEGER,
        // status: available, reserved, occupied
        status: {
            type: DataTypes.ENUM('available', 'reserved', 'occupied'),
            defaultValue: 'available'
        },
        location: DataTypes.STRING // contoh: indoor, outdoor, vip
    }, {
        sequelize,
        modelName: 'Table',
    });

    return Table;
};