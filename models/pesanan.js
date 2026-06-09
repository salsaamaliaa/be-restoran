'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Pesanan extends Model {
        static associate(models) {
            Pesanan.belongsTo(models.User, { foreignKey: 'user_id' });
            Pesanan.belongsTo(models.Menu, { foreignKey: 'menu_id' });
            Pesanan.hasOne(models.Pembayaran, { foreignKey: 'pesanan_id' });
        }
    }

    Pesanan.init({
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        menu_id: { type: DataTypes.INTEGER, allowNull: false },
        nomor_meja: { type: DataTypes.STRING, allowNull: true },   // fix: nullable, diisi nanti
        status: {
            type: DataTypes.ENUM('pending', 'diproses', 'selesai', 'dibatalkan'),
            defaultValue: 'pending'
        }
    }, {
        sequelize,
        modelName: 'Pesanan',
    });

    return Pesanan;
};