const { Menu, MenuCategory } = require('../models');
const { response } = require('../helpers/response.formatter');

module.exports = {
    getMenus: async (req, res) => {
        try {
            const menus = await Menu.findAll({
                include: [{ model: MenuCategory }],
                order: [['name', 'ASC']]
            });
            
            // Format response agar image path benar
            const formattedMenus = menus.map(menu => {
                const menuData = menu.toJSON();
                if (menuData.image) {
                    if (!menuData.image.startsWith('http') && !menuData.image.startsWith('/uploads')) {
                        menuData.image = `http://localhost:3000/uploads/${menuData.image}`;
                    }
                }
                return menuData;
            });
            
            return res.status(200).json({
                status: 200,
                message: 'Success',
                data: formattedMenus
            });
        } catch (error) {
            console.error('Get menus error:', error);
            return res.status(500).json(response(500, 'Server Error', error.message));
        }
    },

    getMenuById: async (req, res) => {
        try {
            const menu = await Menu.findByPk(req.params.id, {
                include: [{ model: MenuCategory }]
            });
            if (!menu) {
                return res.status(404).json(response(404, 'Menu tidak ditemukan'));
            }
            return res.status(200).json(response(200, 'Success', menu));
        } catch (error) {
            return res.status(500).json(response(500, 'Server Error', error.message));
        }
    },

    createMenu: async (req, res) => {
        try {
            const { category_id, name, description, price } = req.body;
            
            const menu = await Menu.create({
                category_id: category_id,
                name: name,
                description: description || '',
                price: price,
                image: req.file ? req.file.filename : null,
                is_available: true
            });

            return res.status(201).json(response(201, 'Menu berhasil dibuat', menu));
        } catch (error) {
            return res.status(500).json(response(500, 'Server Error', error.message));
        }
    },

    updateMenu: async (req, res) => {
        try {
            const { id } = req.params;
            const { category_id, name, description, price, is_available } = req.body;

            const menu = await Menu.findByPk(id);
            if (!menu) {
                return res.status(404).json(response(404, 'Menu tidak ditemukan'));
            }

            const updateData = {
                category_id: category_id || menu.category_id,
                name: name || menu.name,
                description: description !== undefined ? description : menu.description,
                price: price || menu.price,
                is_available: is_available !== undefined ? is_available : menu.is_available
            };

            if (req.file) {
                updateData.image = req.file.filename;
            }

            await menu.update(updateData);

            return res.status(200).json(response(200, 'Menu berhasil diperbarui', menu));
        } catch (error) {
            return res.status(500).json(response(500, 'Server Error', error.message));
        }
    },

    deleteMenu: async (req, res) => {
        try {
            const { id } = req.params;
            const menu = await Menu.findByPk(id);
            if (!menu) {
                return res.status(404).json(response(404, 'Menu tidak ditemukan'));
            }
            await menu.destroy();
            return res.status(200).json(response(200, 'Menu berhasil dihapus'));
        } catch (error) {
            return res.status(500).json(response(500, 'Server Error', error.message));
        }
    },

    updateAvailability: async (req, res) => {
        try {
            const { id } = req.params;
            const { is_available } = req.body;

            const menu = await Menu.findByPk(id);
            if (!menu) {
                return res.status(404).json(response(404, 'Menu tidak ditemukan'));
            }

            await menu.update({ is_available: is_available });
            return res.status(200).json(response(200, 'Status menu diperbarui', menu));
        } catch (error) {
            return res.status(500).json(response(500, 'Server Error', error.message));
        }
    }
};

