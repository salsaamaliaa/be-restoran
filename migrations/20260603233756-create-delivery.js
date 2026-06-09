'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('DeliveryOrders', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            user_id: {
                type: Sequelize.INTEGER,
                references: { model: 'Users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            driver_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'Users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            delivery_address: { type: Sequelize.TEXT },
            total_price: { type: Sequelize.DECIMAL(10, 2) },
            notes: { type: Sequelize.TEXT },
            status: {
                type: Sequelize.ENUM('pending', 'confirmed', 'preparing', 'on_delivery', 'delivered', 'cancelled'),
                defaultValue: 'pending'
            },
            createdAt: { allowNull: false, type: Sequelize.DATE },
            updatedAt: { allowNull: false, type: Sequelize.DATE }
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('DeliveryOrders');
    }
};