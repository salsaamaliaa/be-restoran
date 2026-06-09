'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class OrderItem extends Model {
        static associate(models) {
            // order item belongs to delivery order
            OrderItem.belongsTo(models.DeliveryOrder, { foreignKey: 'order_id' });
            // order item belongs to menu
            OrderItem.belongsTo(models.Menu, { foreignKey: 'menu_id' });
        }
    }

    OrderItem.init({
        order_id: DataTypes.INTEGER,
        menu_id: DataTypes.INTEGER,
        quantity: DataTypes.INTEGER,
        // harga disimpan saat order, bukan dari menu (antisipasi perubahan harga)
        price_each: DataTypes.DECIMAL(10, 2),
        subtotal: DataTypes.DECIMAL(10, 2)
    }, {
        sequelize,
        modelName: 'OrderItem',
    });

    return OrderItem;
};