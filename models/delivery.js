'use strict';
const { Model } = require('sequelize');


module.exports = (sequelize, DataTypes) => {
    class DeliveryOrder extends Model {
        static associate(models) {
            // delivery order belongs to user (customer)
            DeliveryOrder.belongsTo(models.User, { foreignKey: 'user_id', as: 'customer' });
            // delivery order belongs to user (driver)
            DeliveryOrder.belongsTo(models.User, { foreignKey: 'driver_id', as: 'driver' });
            // delivery order punya banyak order item
            DeliveryOrder.hasMany(models.OrderItem, { foreignKey: 'order_id' });
        }
    }

    DeliveryOrder.init({
        user_id: DataTypes.INTEGER,
        driver_id: {
            type: DataTypes.INTEGER,
            allowNull: true  // driver baru diassign setelah order confirmed
        },
        delivery_address: DataTypes.TEXT,
        total_price: DataTypes.DECIMAL(10, 2),
        notes: DataTypes.TEXT,
        // status: pending, confirmed, preparing, on_delivery, delivered, cancelled
        status: {
            type: DataTypes.ENUM('pending', 'confirmed', 'preparing', 'on_delivery', 'delivered', 'cancelled'),
            defaultValue: 'pending'
        }
    }, {
        sequelize,
        modelName: 'DeliveryOrder',
    });

    return DeliveryOrder;
};