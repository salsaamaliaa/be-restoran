const Validator = require("fastest-validator");
const v = new Validator();
const { Pembayaran, Pesanan, Menu, User, sequelize } = require('../models');
const { response } = require('../helpers/response.formatter');

module.exports = {
    // Buat pembayaran untuk satu pesanan
    createPembayaran: async (req, res) => {
        const t = await sequelize.transaction();
        try {
            const { pesanan_id, metode_pembayaran } = req.body;

            const schema = {
                pesanan_id: { type: "number", positive: true, integer: true },
                metode_pembayaran: { type: "string" }
            };
            const data = { pesanan_id: Number(pesanan_id), metode_pembayaran };

            const validate = v.validate(data, schema);
            if (validate.length > 0) {
                await t.rollback();
                return res.status(400).json(response(400, "Validasi Error", validate));
            }

            const allowedMetode = ['tunai', 'transfer', 'qris'];
            if (!allowedMetode.includes(data.metode_pembayaran)) {
                await t.rollback();
                return res.status(400).json(response(400, "Validasi Error", `Metode pembayaran harus: ${allowedMetode.join(', ')}`));
            }

            const pesanan = await Pesanan.findByPk(data.pesanan_id, { include: [{ model: Menu }] });
            if (!pesanan) {
                await t.rollback();
                return res.status(404).json(response(404, "Pesanan tidak ditemukan"));
            }

            // User hanya bisa membayar pesanan mereka sendiri
            if (pesanan.user_id !== req.user.userId) {
                await t.rollback();
                return res.status(403).json(response(403, "Forbidden"));
            }

            // Cek apakah sudah ada pembayaran
            const existingPembayaran = await Pembayaran.findOne({ where: { pesanan_id: data.pesanan_id } });
            if (existingPembayaran) {
                await t.rollback();
                return res.status(400).json(response(400, "Validasi Error", "Pesanan ini sudah dibayar"));
            }

            // User bisa bayar di status apapun kecuali dibatalkan
            if (pesanan.status === 'dibatalkan') {
                await t.rollback();
                return res.status(400).json(response(400, "Validasi Error", "Pesanan dibatalkan, tidak bisa dibayar"));
            }

            const total_harga = Number(pesanan.Menu.price);
            const kembalian = 0;

            // Status pembayaran: jika tunai langsung success, jika transfer/qris pending
            const status = data.metode_pembayaran === 'tunai' ? 'success' : 'pending';

            const pembayaran = await Pembayaran.create({
                pesanan_id: data.pesanan_id,
                total_harga,
                metode_pembayaran: data.metode_pembayaran,
                kembalian,
                status,
                payment_date: status === 'success' ? new Date() : null
            }, { transaction: t });

            // Update status pesanan
            const pesananStatus = data.metode_pembayaran === 'tunai' ? 'selesai' : 'diproses';
            await Pesanan.update({ status: pesananStatus }, { where: { id: data.pesanan_id }, transaction: t });
            
            await t.commit();

            const hasil = await Pembayaran.findByPk(pembayaran.id, {
                include: [{
                    model: Pesanan,
                    include: [
                        { model: Menu, attributes: ['id', 'name', 'price', 'image'] },
                        { model: User, attributes: ['id', 'username', 'name'] }
                    ]
                }]
            });

            return res.status(201).json(response(201, "Pembayaran berhasil dibuat", hasil));
        } catch (error) {
            await t.rollback();
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    // Buat pembayaran untuk multiple pesanan (keranjang)
    createBulkPembayaran: async (req, res) => {
        const t = await sequelize.transaction();
        try {
            const { pesanan_ids, metode_pembayaran } = req.body;
            
            if (!pesanan_ids || pesanan_ids.length === 0) {
                return res.status(400).json(response(400, "Pesanan ID tidak boleh kosong"));
            }
            
            const allowedMetode = ['tunai', 'transfer', 'qris'];
            if (!allowedMetode.includes(metode_pembayaran)) {
                return res.status(400).json(response(400, "Metode pembayaran tidak valid"));
            }
            
            const pembayaranList = [];
            let totalHarga = 0;
            
            for (const pesananId of pesanan_ids) {
                const pesanan = await Pesanan.findByPk(pesananId, { 
                    include: [{ model: Menu }],
                    transaction: t 
                });
                
                if (!pesanan) {
                    await t.rollback();
                    return res.status(404).json(response(404, `Pesanan ID ${pesananId} tidak ditemukan`));
                }
                
                if (pesanan.user_id !== req.user.userId) {
                    await t.rollback();
                    return res.status(403).json(response(403, "Forbidden"));
                }
                
                const existingPembayaran = await Pembayaran.findOne({ 
                    where: { pesanan_id: pesananId },
                    transaction: t 
                });
                
                if (existingPembayaran) {
                    await t.rollback();
                    return res.status(400).json(response(400, `Pesanan ID ${pesananId} sudah dibayar`));
                }
                
                const total_harga = Number(pesanan.Menu.price);
                totalHarga += total_harga;
                
                const status = metode_pembayaran === 'tunai' ? 'success' : 'pending';
                
                const pembayaran = await Pembayaran.create({
                    pesanan_id: pesananId,
                    total_harga,
                    metode_pembayaran,
                    kembalian: 0,
                    status,
                    payment_date: status === 'success' ? new Date() : null
                }, { transaction: t });
                
                const pesananStatus = metode_pembayaran === 'tunai' ? 'selesai' : 'diproses';
                await pesanan.update({ status: pesananStatus }, { transaction: t });
                
                pembayaranList.push(pembayaran);
            }
            
            await t.commit();
            
            return res.status(201).json(response(201, "Pembayaran berhasil dibuat", {
                pembayaran: pembayaranList,
                total_harga: totalHarga,
                metode_pembayaran,
                status: metode_pembayaran === 'tunai' ? 'success' : 'pending'
            }));
            
        } catch (error) {
            await t.rollback();
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    // Get semua pembayaran (admin)
    getPembayaran: async (req, res) => {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const offset = (page - 1) * limit;
            
            const whereClause = req.user.role === 'admin' ? {} : { '$Pesanan.user_id$': req.user.userId };

            const { count, rows } = await Pembayaran.findAndCountAll({
                where: whereClause,
                include: [{
                    model: Pesanan,
                    include: [
                        { model: Menu, attributes: ['id', 'name', 'price'] },
                        { model: User, attributes: ['id', 'username', 'name'] }
                    ]
                }],
                order: [['createdAt', 'DESC']],
                limit,
                offset,
                subQuery: false,
                distinct: true
            });

            return res.status(200).json(response(200, "Success", {
                data: rows,
                limit,
                rangeData: `${offset + 1}-${offset + rows.length}`,
                currentPage: page,
                totalPage: Math.ceil(count / limit),
                total: count
            }));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    // Get pembayaran untuk user yang login (riwayat sendiri)
    getMyPembayaran: async (req, res) => {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const offset = (page - 1) * limit;
            
            const { count, rows } = await Pembayaran.findAndCountAll({
                include: [{
                    model: Pesanan,
                    where: { user_id: req.user.userId },
                    include: [
                        { model: Menu, attributes: ['id', 'name', 'price'] }
                    ]
                }],
                order: [['createdAt', 'DESC']],
                limit,
                offset,
                distinct: true
            });
            
            return res.status(200).json(response(200, "Success", {
                data: rows,
                currentPage: page,
                totalPage: Math.ceil(count / limit),
                total: count
            }));
            
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    // Detail pembayaran
    detailPembayaran: async (req, res) => {
        try {
            const pembayaran = await Pembayaran.findByPk(req.params.id, {
                include: [{
                    model: Pesanan,
                    include: [
                        { model: Menu, attributes: ['id', 'name', 'price'] },
                        { model: User, attributes: ['id', 'username', 'name'] }
                    ]
                }]
            });

            if (!pembayaran) return res.status(404).json(response(404, "Data pembayaran tidak ditemukan"));

            if (req.user.role !== 'admin' && pembayaran.Pesanan.user_id !== req.user.userId) {
                return res.status(403).json(response(403, "Forbidden"));
            }

            return res.status(200).json(response(200, "Success", pembayaran));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    // Cek apakah pesanan sudah dibayar
    checkPembayaranByPesanan: async (req, res) => {
        try {
            const { pesanan_id } = req.params;
            const pesanan = await Pesanan.findByPk(pesanan_id);

            if (!pesanan) {
                return res.status(404).json(response(404, "Pesanan tidak ditemukan"));
            }

            if (req.user.role !== 'admin' && pesanan.user_id !== req.user.userId) {
                return res.status(403).json(response(403, "Forbidden"));
            }

            const pembayaran = await Pembayaran.findOne({
                where: { pesanan_id: pesanan_id },
                include: [{
                    model: Pesanan,
                    attributes: ['id', 'status', 'nomor_meja'],
                    include: [{ model: Menu, attributes: ['id', 'name', 'price'] }]
                }]
            });

            if (!pembayaran) {
                return res.status(200).json(response(200, "Success", {
                    paid: false,
                    message: "Pesanan belum dibayar"
                }));
            }

            return res.status(200).json(response(200, "Success", {
                paid: pembayaran.status === 'success',
                status: pembayaran.status,
                data: pembayaran
            }));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    // Konfirmasi pembayaran (untuk transfer/qris)
    confirmPayment: async (req, res) => {
        const t = await sequelize.transaction();
        try {
            const { id } = req.params;
            
            const pembayaran = await Pembayaran.findByPk(id);
            if (!pembayaran) {
                await t.rollback();
                return res.status(404).json(response(404, "Pembayaran tidak ditemukan"));
            }
            
            if (pembayaran.status === 'success') {
                await t.rollback();
                return res.status(400).json(response(400, "Pembayaran sudah dikonfirmasi"));
            }
            
            const pesanan = await Pesanan.findByPk(pembayaran.pesanan_id);
            if (req.user.role !== 'admin' && pesanan.user_id !== req.user.userId) {
                await t.rollback();
                return res.status(403).json(response(403, "Forbidden"));
            }
            
            await pembayaran.update({
                status: 'success',
                payment_date: new Date()
            }, { transaction: t });
            
            if (pesanan && pesanan.status !== 'selesai') {
                await pesanan.update({ status: 'selesai' }, { transaction: t });
            }
            
            await t.commit();
            
            const hasil = await Pembayaran.findByPk(id, {
                include: [{
                    model: Pesanan,
                    include: [
                        { model: Menu, attributes: ['id', 'name', 'price'] },
                        { model: User, attributes: ['id', 'username', 'name'] }
                    ]
                }]
            });
            
            return res.status(200).json(response(200, "Pembayaran berhasil dikonfirmasi", hasil));
            
        } catch (error) {
            await t.rollback();
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    // Update status pembayaran (admin)
    updatePaymentStatus: async (req, res) => {
        const t = await sequelize.transaction();
        try {
            const { id } = req.params;
            const { status } = req.body;
            
            const allowedStatus = ['pending', 'success', 'failed'];
            if (!allowedStatus.includes(status)) {
                return res.status(400).json(response(400, "Status tidak valid"));
            }
            
            const pembayaran = await Pembayaran.findByPk(id);
            if (!pembayaran) {
                await t.rollback();
                return res.status(404).json(response(404, "Pembayaran tidak ditemukan"));
            }
            
            await pembayaran.update({ 
                status,
                payment_date: status === 'success' ? new Date() : pembayaran.payment_date
            }, { transaction: t });
            
            if (status === 'success') {
                const pesanan = await Pesanan.findByPk(pembayaran.pesanan_id);
                if (pesanan && pesanan.status !== 'selesai') {
                    await pesanan.update({ status: 'selesai' }, { transaction: t });
                }
            }
            
            await t.commit();
            
            return res.status(200).json(response(200, "Status pembayaran diperbarui", pembayaran));
            
        } catch (error) {
            await t.rollback();
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    exportPembayaranPdf: async (req, res) => {
        try {
            const whereClause = req.user.role === 'admin' ? {} : { '$Pesanan.user_id$': req.user.userId };
            const data = await Pembayaran.findAll({
                where: whereClause,
                include: [{ model: Pesanan, include: [{ model: Menu }, { model: User }] }],
                order: [['createdAt', 'DESC']]
            });

            const doc = new PDFDocument({ margin: 30 });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=laporan_pembayaran.pdf');
            doc.pipe(res);

            doc.fontSize(18).text('LAPORAN PEMBAYARAN', { align: 'center' });
            doc.fontSize(10).text(`Tanggal: ${new Date().toLocaleString('id-ID')}`, { align: 'center' });
            doc.moveDown();

            let y = doc.y;
            doc.font('Helvetica-Bold');
            doc.text('No', 40, y);
            doc.text('Customer', 80, y);
            doc.text('Menu', 180, y);
            doc.text('Total', 280, y);
            doc.text('Metode', 350, y);
            doc.text('Status', 430, y);
            doc.font('Helvetica');

            data.forEach((p, i) => {
                y += 20;
                if (y > 750) { doc.addPage(); y = 50; }
                doc.text(i + 1, 40, y);
                doc.text(p.Pesanan?.User?.name || '-', 80, y);
                doc.text(p.Pesanan?.Menu?.name || '-', 180, y);
                doc.text(`Rp${Number(p.total_harga).toLocaleString()}`, 280, y);
                doc.text(p.metode_pembayaran, 350, y);
                doc.text(p.status, 430, y);
            });
            doc.end();
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
};