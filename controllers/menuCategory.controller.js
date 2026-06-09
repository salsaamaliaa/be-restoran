const Validator = require('fastest-validator')
const v = new Validator()
const { MenuCategory, Menu } = require('../models')
const { response } = require('../helpers/response.formatter')

module.exports = {
    createCategory: async (req, res) => {
        try {
            const { name, description } = req.body

            const schema = {
                name: { type: 'string', min: 2 },
                description: { type: 'string', optional: true }
            }
            const validate = v.validate({ name, description: description || '' }, schema)
            if (validate.length > 0) {
                return res.status(400).json(response(400, 'Validasi Error', validate))
            }

            const category = await MenuCategory.create({ name, description: description || '' })
            return res.status(201).json(response(201, 'Kategori berhasil dibuat', category))
        } catch (error) {
            return res.status(500).json(response(500, 'Server Error', error.message))
        }
    },

    getCategories: async (req, res) => {
        try {
            const categories = await MenuCategory.findAll({
                include: [{ model: Menu, attributes: ['id', 'name', 'price', 'is_available'] }],
                order: [['name', 'ASC']]
            })
            return res.status(200).json(response(200, 'Success', categories))
        } catch (error) {
            return res.status(500).json(response(500, 'Server Error', error.message))
        }
    },

    updateCategory: async (req, res) => {
        try {
            const { id } = req.params
            const { name, description } = req.body

            const category = await MenuCategory.findByPk(id)
            if (!category) {
                return res.status(404).json(response(404, 'Kategori tidak ditemukan'))
            }

            await MenuCategory.update(
                { name: name || category.name, description: description !== undefined ? description : category.description },
                { where: { id } }
            )
            const updated = await MenuCategory.findByPk(id)
            return res.status(200).json(response(200, 'Kategori berhasil diperbarui', updated))
        } catch (error) {
            return res.status(500).json(response(500, 'Server Error', error.message))
        }
    },

    deleteCategory: async (req, res) => {
        try {
            const { id } = req.params
            const category = await MenuCategory.findByPk(id)
            if (!category) {
                return res.status(404).json(response(404, 'Kategori tidak ditemukan'))
            }
            await MenuCategory.destroy({ where: { id } })
            return res.status(200).json(response(200, 'Kategori berhasil dihapus'))
        } catch (error) {
            return res.status(500).json(response(500, 'Server Error', error.message))
        }
    }
}