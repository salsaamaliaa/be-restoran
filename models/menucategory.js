'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MenuCategory extends Model {
    static associate(models) {
      MenuCategory.hasMany(models.Menu, { foreignKey: 'category_id' });
    }
  }
  
  MenuCategory.init({
    name: DataTypes.STRING,
    description: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'MenuCategory',
    tableName: 'MenuCategories'
  });
  
  return MenuCategory;
};