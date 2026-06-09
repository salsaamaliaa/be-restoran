'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('pembayarans', 'status', {
      type: Sequelize.ENUM('pending', 'success', 'failed'),
      defaultValue: 'pending',
      allowNull: false
    });
    
    await queryInterface.addColumn('pembayarans', 'payment_date', {
      type: Sequelize.DATE,
      allowNull: true
    });
    
    await queryInterface.addColumn('pembayarans', 'notes', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('pembayarans', 'status');
    await queryInterface.removeColumn('pembayarans', 'payment_date');
    await queryInterface.removeColumn('pembayarans', 'notes');
  }
};