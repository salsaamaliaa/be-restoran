const Validator = require('fastest-validator');
const v = new Validator();
const { Table } = require('../models');
const { response } = require('../helpers/response.formatter');

module.exports = {
    createTable: async (req, res) => {
        try {
            const { table_number, capacity, location } = req.body;
            
            const existing = await Table.findOne({ where: { table_number } });
            if (existing) {
                return res.status(400).json(response(400, 'Nomor meja sudah ada'));
            }
            
            const table = await Table.create({
                table_number,
                capacity: Number(capacity),
                location: location || 'indoor',
                status: 'available'
            });
            
            return res.status(201).json(response(201, 'Meja berhasil ditambahkan', table));
        } catch (error) {
            console.error('Create table error:', error);
            return res.status(500).json(response(500, 'Server Error', error.message));
        }
    },

    getTables: async (req, res) => {
        try {
            const tables = await Table.findAll({
                order: [['table_number', 'ASC']]
            });
            
            return res.status(200).json(response(200, 'Success', tables));
        } catch (error) {
            console.error('Get tables error:', error);
            return res.status(500).json(response(500, 'Server Error', error.message));
        }
    },

    updateTable: async (req, res) => {
        try {
            const { id } = req.params;
            const { table_number, capacity, status, location } = req.body;
            
            const table = await Table.findByPk(id);
            if (!table) return res.status(404).json(response(404, 'Meja tidak ditemukan'));
            
            await table.update({
                table_number: table_number || table.table_number,
                capacity: capacity ? Number(capacity) : table.capacity,
                status: status || table.status,
                location: location || table.location
            });
            
            return res.status(200).json(response(200, 'Meja berhasil diperbarui', table));
        } catch (error) {
            return res.status(500).json(response(500, 'Server Error', error.message));
        }
    },

    deleteTable: async (req, res) => {
        try {
            const { id } = req.params;
            const table = await Table.findByPk(id);
            if (!table) return res.status(404).json(response(404, 'Meja tidak ditemukan'));
            
            await table.destroy();
            
            return res.status(200).json(response(200, 'Meja berhasil dihapus'));
        } catch (error) {
            return res.status(500).json(response(500, 'Server Error', error.message));
        }
    }
};