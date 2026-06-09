'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Users', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            name: { type: Sequelize.STRING },
            username: { type: Sequelize.STRING, unique: true },
            password: { type: Sequelize.STRING },
            role: {
                type: Sequelize.ENUM('customer', 'admin', 'driver'),
                defaultValue: 'customer'
            },
            phone: { type: Sequelize.STRING },
            address: { type: Sequelize.TEXT },
            createdAt: { allowNull: false, type: Sequelize.DATE },
            updatedAt: { allowNull: false, type: Sequelize.DATE }
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('Users');
    }
};