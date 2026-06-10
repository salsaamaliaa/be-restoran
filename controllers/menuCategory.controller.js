const { MenuCategory, Menu } = require('../models');
const { response } = require('../helpers/response.formatter');

module.exports = {
    getCategories: async (req, res) => {
        try {
            const categories = await MenuCategory.findAll({
                order: [['name', 'ASC']]
            });
            
            return res.status(200).json({
                status: 200,
                message: 'Success',
                data: categories || []
            });
        } catch (error) {
            console.error('Get categories error:', error);
            return res.status(500).json(response(500, 'Server Error', error.message));
        }
    },

    createCategory: async (req, res) => {
        try {
            const { name, description } = req.body;
            
            if (!name) {
                return res.status(400).json(response(400, 'Nama kategori wajib diisi'));
            }
            
            const category = await MenuCategory.create({
                name,
                description: description || ''
            });
            
            return res.status(201).json(response(201, 'Kategori berhasil dibuat', category));
        } catch (error) {
            return res.status(500).json(response(500, 'Server Error', error.message));
        }
    },

    updateCategory: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, description } = req.body;
            
            const category = await MenuCategory.findByPk(id);
            if (!category) {
                return res.status(404).json(response(404, 'Kategori tidak ditemukan'));
            }
            
            await category.update({
                name: name || category.name,
                description: description !== undefined ? description : category.description
            });
            
            return res.status(200).json(response(200, 'Kategori berhasil diperbarui', category));
        } catch (error) {
            return res.status(500).json(response(500, 'Server Error', error.message));
        }
    },

    deleteCategory: async (req, res) => {
        try {
            const { id } = req.params;
            const category = await MenuCategory.findByPk(id);
            if (!category) {
                return res.status(404).json(response(404, 'Kategori tidak ditemukan'));
            }
            
            await category.destroy();
            return res.status(200).json(response(200, 'Kategori berhasil dihapus'));
        } catch (error) {
            return res.status(500).json(response(500, 'Server Error', error.message));
        }
    }
};

