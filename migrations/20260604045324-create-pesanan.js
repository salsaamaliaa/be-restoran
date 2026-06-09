'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Pesanans', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            user_id: { type: Sequelize.INTEGER, allowNull: false },
            menu_id: { type: Sequelize.INTEGER, allowNull: false },
            nomor_meja: { type: Sequelize.STRING, allowNull: true },  // fix: nullable
            status: {
                type: Sequelize.ENUM('pending', 'diproses', 'selesai', 'dibatalkan'),
                defaultValue: 'pending'
            },
            createdAt: { allowNull: false, type: Sequelize.DATE },
            updatedAt: { allowNull: false, type: Sequelize.DATE }
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('Pesanans');
    }
};