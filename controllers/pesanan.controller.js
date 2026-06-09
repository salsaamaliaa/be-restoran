const Validator = require('fastest-validator');
const v = new Validator();
const { Pesanan, Menu, User } = require('../models');
const { response } = require('../helpers/response.formatter');

module.exports = {
    createPesanan: async (req, res) => {
        try {
            const { menu_id, nomor_meja } = req.body;
            
            const menu = await Menu.findByPk(menu_id);
            if (!menu) return res.status(404).json(response(404, 'Menu tidak ditemukan'));
            if (!menu.is_available) return res.status(400).json(response(400, 'Menu tidak tersedia'));

            const pesanan = await Pesanan.create({
                user_id: req.user.userId,
                menu_id: menu_id,
                nomor_meja: nomor_meja || null,
                status: 'pending'
            });

            const hasil = await Pesanan.findByPk(pesanan.id, {
                include: [
                    { model: Menu, as: 'Menu' },
                    { model: User, as: 'User' }
                ]
            });

            return res.status(201).json(response(201, 'Pesanan berhasil dibuat', hasil));
        } catch (error) {
            console.error('Create pesanan error:', error);
            return res.status(500).json(response(500, 'Server Error', error.message));
        }
    },

    getPesanan: async (req, res) => {
        try {
            const whereClause = req.user.role === 'admin' ? {} : { user_id: req.user.userId };
            
            const pesanan = await Pesanan.findAll({
                where: whereClause,
                include: [
                    { model: Menu, as: 'Menu' },
                    { model: User, as: 'User', attributes: ['id', 'name', 'username'] }
                ],
                order: [['createdAt', 'DESC']]
            });
            
            return res.status(200).json(response(200, 'Success', pesanan));
        } catch (error) {
            console.error('Get pesanan error:', error);
            return res.status(500).json(response(500, 'Server Error', error.message));
        }
    },

    updateStatusPesanan: async (req, res) => {
        try {
            const { status } = req.body;
            const allowedStatus = ['pending', 'diproses', 'selesai', 'dibatalkan'];
            
            if (!allowedStatus.includes(status)) {
                return res.status(400).json(response(400, 'Status tidak valid'));
            }
            
            const pesanan = await Pesanan.findByPk(req.params.id);
            if (!pesanan) return res.status(404).json(response(404, 'Pesanan tidak ditemukan'));
            
            await pesanan.update({ status });
            
            const hasil = await Pesanan.findByPk(req.params.id, {
                include: [
                    { model: Menu, as: 'Menu' },
                    { model: User, as: 'User' }
                ]
            });
            
            return res.status(200).json(response(200, 'Status berhasil diupdate', hasil));
        } catch (error) {
            return res.status(500).json(response(500, 'Server Error', error.message));
        }
    },

    updateNomorMeja: async (req, res) => {
        try {
            const { nomor_meja } = req.body;
            const pesanan = await Pesanan.findByPk(req.params.id);
            
            if (!pesanan) return res.status(404).json(response(404, 'Pesanan tidak ditemukan'));
            
            await pesanan.update({ nomor_meja: nomor_meja || null });
            
            return res.status(200).json(response(200, 'Nomor meja berhasil diupdate', pesanan));
        } catch (error) {
            return res.status(500).json(response(500, 'Server Error', error.message));
        }
    },

    deletePesanan: async (req, res) => {
        try {
            const pesanan = await Pesanan.findByPk(req.params.id);
            if (!pesanan) return res.status(404).json(response(404, 'Pesanan tidak ditemukan'));
            
            await pesanan.update({ status: 'dibatalkan' });
            
            return res.status(200).json(response(200, 'Pesanan berhasil dibatalkan'));
        } catch (error) {
            return res.status(500).json(response(500, 'Server Error', error.message));
        }
    }
};