const Validator = require('fastest-validator');
const v = new Validator();
const { Menu, MenuCategory } = require('../models');
const { response } = require('../helpers/response.formatter');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

module.exports = {
    createMenu: async (req, res) => {
        try {
            const { category_id, name, description, price } = req.body;

            const schema = {
                category_id: { type: 'number', positive: true, integer: true },
                name: { type: 'string', min: 2 },
                description: { type: 'string', optional: true },
                price: { type: 'number', positive: true }
            };
            const data = {
                category_id: Number(category_id),
                name,
                description: description || '',
                price: Number(price)
            };
            const validate = v.validate(data, schema);
            if (validate.length > 0) {
                return res.status(400).json(response(400, 'Validasi Error', validate));
            }

            if (!req.file) {
                return res.status(400).json(response(400, 'Gambar menu wajib diupload'));
            }

            const category = await MenuCategory.findByPk(data.category_id);
            if (!category) {
                return res.status(400).json(response(400, 'Validasi Error', 'Kategori tidak ditemukan'));
            }

            // Simpan dengan path /uploads/nama_file
            const imagePath = `/uploads/${req.file.filename}`;

            const menu = await Menu.create({
                category_id: data.category_id,
                name: data.name,
                description: data.description,
                price: data.price,
                image: imagePath,
                is_available: true
            });

            const menuWithCategory = await Menu.findByPk(menu.id, { include: MenuCategory });
            return res.status(201).json(response(201, 'Menu berhasil dibuat', menuWithCategory));
        } catch (error) {
            return res.status(500).json(response(500, 'Server Error', error.message));
        }
    },

    getMenus: async (req, res) => {
        try {
            const { name, category_id, is_available } = req.query;

            const whereClause = {};
            if (name) whereClause.name = { [Op.like]: `%${name}%` };
            if (category_id) whereClause.category_id = category_id;
            if (is_available !== undefined) whereClause.is_available = is_available === 'true';

            const menus = await Menu.findAll({
                where: whereClause,
                include: [{ model: MenuCategory, attributes: ['id', 'name'] }],
                order: [['name', 'ASC']]
            });

            return res.status(200).json(response(200, 'Success', menus));
        } catch (error) {
            return res.status(500).json(response(500, 'Server Error', error.message));
        }
    },

    detailMenu: async (req, res) => {
        try {
            const { id } = req.params;
            const menu = await Menu.findByPk(id, {
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

    updateMenu: async (req, res) => {
        try {
            const { id } = req.params;
            const { category_id, name, description, price, is_available } = req.body;

            const menuBefore = await Menu.findByPk(id);
            if (!menuBefore) {
                return res.status(404).json(response(404, 'Menu tidak ditemukan'));
            }

            if (req.file) {
                const oldImage = menuBefore.image;
                if (oldImage) {
                    const oldFilename = oldImage.replace('/uploads/', '');
                    const filePosition = path.join(__dirname, '../uploads', oldFilename);
                    if (fs.existsSync(filePosition)) {
                        fs.unlinkSync(filePosition);
                    }
                }
            }

            const updateData = {
                category_id: category_id ? Number(category_id) : menuBefore.category_id,
                name: name || menuBefore.name,
                description: description !== undefined ? description : menuBefore.description,
                price: price ? Number(price) : menuBefore.price,
                is_available: is_available !== undefined ? (is_available === 'true' || is_available === true) : menuBefore.is_available
            };

            if (req.file) {
                updateData.image = `/uploads/${req.file.filename}`;
            }

            await Menu.update(updateData, { where: { id } });

            const updatedMenu = await Menu.findByPk(id, { include: MenuCategory });
            return res.status(200).json(response(200, 'Menu berhasil diperbarui', updatedMenu));
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

            const image = menu.image;
            if (image) {
                const filename = image.replace('/uploads/', '');
                const filePosition = path.join(__dirname, '../uploads', filename);
                if (fs.existsSync(filePosition)) {
                    fs.unlinkSync(filePosition);
                }
            }

            await Menu.destroy({ where: { id } });
            return res.status(200).json(response(200, 'Menu berhasil dihapus'));
        } catch (error) {
            return res.status(500).json(response(500, 'Server Error', error.message));
        }
    }
};