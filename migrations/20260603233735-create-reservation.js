'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Reservations', {
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
            table_id: {
                type: Sequelize.INTEGER,
                references: { model: 'Tables', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            reservation_date: { type: Sequelize.DATE },
            guest_count: { type: Sequelize.INTEGER },
            notes: { type: Sequelize.TEXT },
            status: {
                type: Sequelize.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
                defaultValue: 'pending'
            },
            createdAt: { allowNull: false, type: Sequelize.DATE },
            updatedAt: { allowNull: false, type: Sequelize.DATE }
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('Reservations');
    }
};