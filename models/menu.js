'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Menu extends Model {
    static associate(models) {
      Menu.belongsTo(models.MenuCategory, { foreignKey: 'category_id' });
    }
  }
  
  Menu.init({
    category_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    price: DataTypes.DECIMAL(10, 2),
    image: DataTypes.STRING,
    is_available: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Menu',
    tableName: 'Menus'
  });
  
  return Menu;
};