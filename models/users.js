'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        static associate(models) {
            User.hasMany(models.Reservation, { foreignKey: 'user_id' });
            User.hasMany(models.DeliveryOrder, { foreignKey: 'user_id' });
            User.hasMany(models.Pesanan, { foreignKey: 'user_id' });
        }
    }

    User.init({
        name: DataTypes.STRING,
        username: DataTypes.STRING,
        password: DataTypes.STRING,
        role: {
            type: DataTypes.ENUM('customer', 'admin', 'driver'),
            defaultValue: 'customer'
        },
        phone: DataTypes.STRING,
        address: DataTypes.TEXT
    }, {
        sequelize,
        modelName: 'User',
        tableName: 'Users'
    });

    return User;
};