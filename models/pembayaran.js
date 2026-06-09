'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Pembayaran extends Model {
    static associate(models) {
      Pembayaran.belongsTo(models.Pesanan, {
        foreignKey: 'pesanan_id'
      });
    }
  }

  Pembayaran.init({
    pesanan_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    total_harga: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    metode_pembayaran: {
      type: DataTypes.ENUM('tunai', 'transfer', 'qris'),
      allowNull: false
    },
    kembalian: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('pending', 'success', 'failed'),
      defaultValue: 'pending',
      allowNull: false
    },
    payment_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Pembayaran',
  });

  return Pembayaran;
};