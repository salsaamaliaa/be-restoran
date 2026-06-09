'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('OrderItems', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            order_id: {
                type: Sequelize.INTEGER,
                references: { model: 'DeliveryOrders', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            menu_id: {
                type: Sequelize.INTEGER,
                references: { model: 'Menus', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            quantity: { type: Sequelize.INTEGER },
            price_each: { type: Sequelize.DECIMAL(10, 2) },
            subtotal: { type: Sequelize.DECIMAL(10, 2) },
            createdAt: { allowNull: false, type: Sequelize.DATE },
            updatedAt: { allowNull: false, type: Sequelize.DATE }
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('OrderItems');
    }
};