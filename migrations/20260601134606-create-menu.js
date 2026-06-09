'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Menus', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            category_id: {
                type: Sequelize.INTEGER,
                references: { model: 'MenuCategories', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            name: { type: Sequelize.STRING },
            description: { type: Sequelize.TEXT },
            price: { type: Sequelize.DECIMAL(10, 2) },
            image: { type: Sequelize.STRING },
            is_available: { type: Sequelize.BOOLEAN, defaultValue: true },
            createdAt: { allowNull: false, type: Sequelize.DATE },
            updatedAt: { allowNull: false, type: Sequelize.DATE }
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('Menus');
    }
};