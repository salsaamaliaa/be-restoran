'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Menu extends Model {
        static associate(models) {
            Menu.belongsTo(models.MenuCategory, { foreignKey: 'category_id' });
            Menu.hasMany(models.OrderItem, { foreignKey: 'menu_id' });
            Menu.hasMany(models.Pesanan, { foreignKey: 'menu_id' }); // tambahan
        }
    }

    Menu.init({
        category_id: DataTypes.INTEGER,
        name: DataTypes.STRING,
        description: DataTypes.TEXT,
        price: DataTypes.DECIMAL(10, 2),
        image: {
            type: DataTypes.STRING,
            get() {
                let imageName = this.getDataValue('image');
                if (!imageName) return null;
                // If it's already a full URL, return as-is
                if (imageName.startsWith('http://') || imageName.startsWith('https://')) {
                    return imageName;
                }
                // normalize stored values like '/uploads/filename' or 'uploads/filename'
                if (imageName.startsWith('/uploads/')) {
                    imageName = imageName.replace('/uploads/', '');
                }
                if (imageName.startsWith('uploads/')) {
                    imageName = imageName.replace('uploads/', '');
                }
                return `http://localhost:3000/uploads/${imageName}`;
            }
        },
        is_available: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        sequelize,
        modelName: 'Menu',
    });

    return Menu;
};