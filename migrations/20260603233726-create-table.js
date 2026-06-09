'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Tables', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            table_number: { type: Sequelize.STRING, unique: true },
            capacity: { type: Sequelize.INTEGER },
            status: {
                type: Sequelize.ENUM('available', 'reserved', 'occupied'),
                defaultValue: 'available'
            },
            location: { type: Sequelize.STRING },
            createdAt: { allowNull: false, type: Sequelize.DATE },
            updatedAt: { allowNull: false, type: Sequelize.DATE }
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('Tables');
    }
};